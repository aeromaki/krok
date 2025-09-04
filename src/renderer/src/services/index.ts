import { useMutation } from "@tanstack/react-query";
import { authAtom, userAtom, store } from "../atoms";


export async function getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
  await navigator.mediaDevices.getUserMedia({ audio: true });
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(device => device.kind === 'audioinput' && device.deviceId !== "default");
}


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


async function login(request: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      username: request.email,
      password: request.password
    })
  });
  if (!res.ok) {
    throw new Error('로그인 실패');
  }
  const { token, email, userName } = await res.json();

  store.set(authAtom, token);
  store.set(userAtom, { email, userName });

  return { token, email, userName };
}

export function useLogin() {
  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: login,
  });
}

function authPost(input: string, body: BodyInit, headers?: HeadersInit) {
  const token = store.get(authAtom);
  if (!token) {
    throw new Error('로그인 세션이 유효하지 않습니다.');
  }

  return fetch(API_BASE_URL + input, {
    method: 'POST',
    headers: {
      ...headers,
      'Authorization': `Bearer ${token}`,
    },
    body
  }).catch(err => {
    console.error(err);
    throw new Error('오류가 발생했습니다.\n인터넷 연결을 확인해주세요.');
  }).then(async res => {
    if (res.status !== 200) {
      throw new Error((await res.json()).detail);
    } else {
      return await res.json();
    }
  })
}


async function postToBack(input: string, body: any) {
  const res = await fetch(`http://127.0.0.1:7777${input}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    throw new Error(`실패, ${(await res.json()).error}`);
  }
  return await res.json();
}

export async function connectObs(body: {
  address: string,
  password: string
}) {
  return await postToBack('/connect', body);
}

export async function updateOrRefreshObs(body: {
  sourceName: string,
  width: number,
  height: number,
  result: Result | null
}) {
  return await postToBack('/overlay/upsertOrRefresh', body);
}

export async function setObsVisibility(body: {
  sourceName: string,
  visible: boolean
}) {
  return await postToBack('/overlay/visible', body);
}

export async function createRecorder(
  audioInputDevice: MediaDeviceInfo,
  chunks: React.RefObject<BlobPart[]>,
  setResult: React.Dispatch<React.SetStateAction<Result | null>>
) {
  chunks.current = [];

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: audioInputDevice
  });

  const recorder = new MediaRecorder(stream);

  recorder.ondataavailable = (e: BlobEvent) => {
    if (e.data.size > 0) {
      chunks.current.push(e.data);
    }
  };
  recorder.onstop = async () => {
    const blob = new Blob(chunks.current, { type: 'audio/webm' });
    const fileName = `${Date.now()}.webm`;
    const file = new File([blob], fileName, { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('file', file);

    authPost('/api/analyze', formData)
      .then(res => {
        console.log(res);
        setResult(res);
      }).catch((err: Error) => {
        console.error(err);
        alert(err.message);
      })
  };

  return recorder;
}


const PITCH_TEXTS = [
  '아쉬움',
  '조금 아쉬움',
  '보통',
  '좋음',
  '매우 좋음'
];

function formatResult(songTitle: string, result: Result) {
  return `\
부른 곡: ${songTitle}
음정 정확도: ${result.pitch}%
박자 정확도: ${result.rhythm}%
감정 표현: ${PITCH_TEXTS[result.emotion - 1]}
종합 점수: ${'★'.repeat(Math.min(Math.floor(result.total / 20 + 1), 5))}
심사평: ${result.content}`
}

export async function sendMessage(
  to: string,
  songTitle: string,
  result: Result
) {
  const content = formatResult(songTitle, result);
  const token = store.get(authAtom);
  if (!token) {
    alert('로그인 세션이 유효하지 않습니다.');
    return;
  }

  authPost('/api/sendsms', JSON.stringify({ to, content }), {
    'Content-Type': 'application/json'
  }).then(res => {
    console.log(res);
    alert('전송을 완료했습니다.');
  }).catch((err: Error) => {
    alert(err.message);
  })
};