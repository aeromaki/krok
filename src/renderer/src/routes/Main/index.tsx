import { useCallback, useEffect, useRef, useState } from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import styles from './Main.module.css';
import Modal from "react-modal";
import { audioInputDeviceAtom, authAtom, obsAtom, userAtom } from '../../atoms';
import { Button } from '../../components';

import { AudioInputSelector, AudioVisualizer, ResultContainer } from './components';

import call from '../../assets/call.png';
import music from '../../assets/music.png';
import { connectObs, createRecorder, sendMessage, setObsVisibility, updateOrRefreshObs } from '../../services';

Modal.setAppElement("#root");


function InputRow({ ref, icon, id, text, placeholder, setValue, submit, back }: {
  ref?: React.RefObject<HTMLInputElement | null>,
  icon: string,
  id: string,
  text: string,
  placeholder: string,
  setValue: React.Dispatch<React.SetStateAction<string>>
  submit?: () => void,
  back?: () => void
}) {
  return (
    <div className={styles.inputRow}>
      <img src={icon} draggable={false} />
      <label htmlFor={id}>{text}</label>
      <input
        ref={ref}
        id={id}
        type='text'
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (!ref?.current?.value && ['Backspace', 'Clear', 'Delete'].includes(e.key)) {
            e.preventDefault();
            back?.();
          }
          else if (e.key === 'Enter') {
            e.preventDefault();
            submit?.();
          }
        }}
        placeholder={placeholder}
      />
    </div>
  )
}

function useTimer(): [string, { start: () => void, stop: () => void }] {
  const [time, setTime] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const min = String(Math.floor(time / 60)).padStart(2, '0');
    const sec = String(time % 60).padStart(2, '0');
    setTimeStr(`${min}:${sec}`);
  }, [time]);

  const start = () => {
    const id = setInterval(() => {
      setTime(time => time + 1);
    }, 1000);
    setIntervalId(id);
  };
  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      setTime(0);
    }
  };

  return [timeStr, { start, stop }];
}

function Recorder({ audioInputDevice, setResult }: {
  audioInputDevice: MediaDeviceInfo | null,
  setResult: React.Dispatch<React.SetStateAction<Result | null>>
}) {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const chunks = useRef<BlobPart[]>([]);
  const [time, timer] = useTimer();

  const setupRecorder = useCallback(async () => {
    if (!audioInputDevice) {
      setRecorder(null);
      return;
    }

    const recorder_ = await createRecorder(audioInputDevice, chunks, setResult);
    setRecorder(recorder_);
  }, [audioInputDevice, setResult]);

  useEffect(() => {
    setupRecorder();
  }, [setupRecorder]);

  const stopRecording = async () => {
    recorder?.stop();
    setRecording(false);
    setupRecorder();
    timer.stop();
  }

  return (
    <div className={styles.startButtonContainer}>
      <Button
        className={styles.green}
        text={recording ? time : '시작'}
        onClick={() => {
          if (!recorder) {
            alert('오디오 입력 설정을 다시 확인해주세요.');
          } else {
            setRecording(true);
            setResult(null);
            recorder.start();
            timer.start();
            setTimeout(stopRecording, 1000 * 60 * 20);
          }
        }}
        disabled={recording}
      />
      <Button
        className={styles.darkgray}
        text='종료'
        onClick={() => {
          if (!recorder) {
            alert('오디오 입력 설정을 다시 확인해주세요.');
            setRecording(false);
          } else {
            stopRecording();
          }
        }}
        disabled={!recording}
      />
      <Button
        className={undefined}
        text='초기화'
        onClick={() => setResult(null)}
        disabled={recording}
      />
    </div>
  )
}

export default function Main() {
  const setAuth = useSetAtom(authAtom);
  const [audioInputDevice, setAudioInputDevice] = useAtom(audioInputDeviceAtom);
  const { userName, email } = useAtomValue(userAtom);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const songRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [obsInfo, setObsInfo] = useAtom(obsAtom);
  const [obsAddress, setObsAddress] = useState('');
  const [obsPassword, setObsPassword] = useState('');
  const [obsSceneName, setObsSceneName] = useState('');

  const [result, setResult] = useState<Result | null>(null);

  return (
    <div className={styles.mainRoot}>
      <Modal style={{
        overlay: {
          zIndex: 9999999
        },
        content: {
          display: 'flex',
          flexDirection: 'column',
          height: '50%'
        }
      }} isOpen={isOpen} onRequestClose={() => setIsOpen(false)}>
        <div className={styles.modalContainer}>
          <h3>OBS 연결 설정</h3>
          <h4>웹소켓 서버 주소</h4>
          <input
            id='obsPort'
            type='text'
            value={obsAddress}
            onChange={(e) => setObsAddress(e.target.value)}
          />
          <h4>웹소켓 서버 비밀번호</h4>
          <input
            id='obsPassword'
            type='text'
            value={obsPassword}
            onChange={(e) => setObsPassword(e.target.value)}
          />
          <h4>송출할 장면 이름</h4>
          <input
            id='obsSceneName'
            type='text'
            value={obsSceneName}
            onChange={(e) => setObsSceneName(e.target.value)}
          />
          <div className={styles.modalButtonContainer}>
            <div>
              <Button
                onClick={() => {
                  setObsInfo({ address: obsAddress, password: obsPassword, sceneName: obsSceneName });
                  setIsOpen(false);
                }}
                text='저장'
                disabled={obsAddress === obsInfo.address && obsPassword === obsInfo.password && obsSceneName === obsInfo.sceneName}
              />
              <Button
                onClick={() => {
                  setObsAddress(obsInfo.address);
                  setObsPassword(obsInfo.password);
                  setObsSceneName(obsInfo.sceneName);
                  setIsOpen(false);
                }}
                text='닫기'
              />
            </div>
          </div>
        </div>
      </Modal>
      <header>
        <span>
          <span>현재 계정: </span>
          <span className={styles.userInfoSpan}>{userName} ({email})</span>
        </span>
        <div>
          <Button
            onClick={() => setIsOpen(true)}
            text='OBS 연결 설정'
          />
          <Button
            onClick={() => {
              setAuth(null);
              alert('로그아웃했습니다.');
            }}
            text='로그아웃'
          />
        </div>
      </header>
      <div className={styles.audioInputSelectorContainer}>
        <label htmlFor='audioInputSelector'>오디오 입력 선택</label>
        <div>
          <AudioInputSelector audioInputDevice={audioInputDevice} setAudioInputDevice={setAudioInputDevice} />
          <AudioVisualizer deviceId={audioInputDevice?.deviceId ?? null}/>
        </div>
      </div>
      <div className={styles.inputRowContainer}>
        <InputRow
          ref={phoneRef}
          icon={call}
          id='phoneNumber'
          text='현재 연결된 참가자:'
          placeholder='010-XXXX-XXXX'
          setValue={setPhoneNumber}
          submit={() => songRef.current?.focus()}
        />
        <InputRow
          ref={songRef}
          icon={music}
          id='songTitle'
          text='부르는 곡:'
          placeholder='<노래 제목>'
          setValue={setSongTitle}
          back={() => phoneRef.current?.focus()}
          submit={() => songRef.current?.blur()}
        />
      </div>
      <Recorder audioInputDevice={audioInputDevice} setResult={setResult} />
      <ResultContainer result={result} />
      <div className={styles.endButtonContainer}>
        <Button
          className={undefined}
          text='문자 전송'
          onClick={() => {
            if (!phoneNumber || !songTitle) {
              alert('참가자의 전화번호와 곡 제목을 입력해주세요.');
              return;
            }
            if (!result) {
              alert('전송할 분석 결과가 없습니다.');
              return;
            }
            sendMessage(phoneNumber, songTitle, result);
          }}
        />
        <Button
          className={styles.obsButton}
          text='방송 화면에 출력'
          onClick={() => {
            connectObs({
              address: obsInfo.address,
              password: obsInfo.password,
              sceneName: obsInfo.sceneName
            }).then(() => updateOrRefreshObs({
              sourceName: 'AIKaraoke',
              width: 310,
              height: 520,
              result: result
            })).then(() => setObsVisibility({
              sourceName: 'AIKaraoke',
              visible: true
            })).catch(e => alert(`오류가 발생했습니다.\nOBS 연결 설정을 다시 확인해주세요.\n\n${e.message}`));
          }}
        />
        <Button
          className={styles.obsButton}
          text='출력 숨기기'
          onClick={() => {
            setObsVisibility({
              sourceName: 'AIKaraoke',
              visible: false
            }).catch(e => alert(`오류가 발생했습니다.\nOBS 연결 설정을 다시 확인해주세요.\n\n${e.message}`));
          }}
        />
      </div>
    </div>
  )
}