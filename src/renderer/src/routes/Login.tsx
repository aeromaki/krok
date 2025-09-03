import { useRef, useState } from 'react';
import styles from './Login.module.css'
import { useNavigate } from 'react-router-dom';
import { Button } from '../components';

import hide from '../assets/hide.png';
import show from '../assets/show.png';
import { useLogin } from '../services';


function LoginInput({ ref, inputType, setValue, back, submit }: {
  ref?: React.RefObject<HTMLInputElement | null>,
  inputType: 'email' | 'password',
  setValue: React.Dispatch<React.SetStateAction<string>>,
  back?: () => void,
  submit?: () => void
}) {
  const { label, autoComplete, placeholder } = inputType === 'email' ? {
    label: '이메일',
    autoComplete: 'email',
    placeholder: 'qwerty@asdf.com'
  } : {
    label: '비밀번호',
    autoComplete: 'current-password',
    placeholder: 'password'
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.loginInput}>
      <label htmlFor={inputType}>{label}</label>
      <div className={styles.loginInputInputContainer}>
        <input
          ref={ref}
          id={inputType}
          name={inputType}
          type={showPassword ? 'text' : inputType}
          autoComplete={autoComplete}
          placeholder={placeholder}
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
        />
        <div
          className={styles.loginInputInputShowButtonContainer}
          style={{
            display: inputType === 'email' ? 'none': undefined
          }}
        >
          <button
            className={styles.loginInputInputShowButton}
            onClick={() => setShowPassword(x => !x)}
          >
            <img src={showPassword ? show : hide} draggable={false} />
          </button>
        </div>
      </div>
    </div>
  )
}


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();

  const loginMutation = useLogin();

  const onEnter = () => {
    passwordRef.current?.focus();
  };

  const onSubmit = () => {
    if (!email || !password) {
      alert('빈칸을 전부 입력해주세요.');
    } else {
      loginMutation.mutateAsync({ email, password }).then(() => {
        navigate('/');
      }).catch((error) => {
        alert(`로그인 실패. 이메일 주소와 비밀번호를 다시 확인해주세요.\n\n${error.message}`);
      });
    }
  }

  return (
    <div className={styles.loginRoot}>
      <h1>AI 전화노래방</h1>
      <div className={styles.loginInputContainer}>
        <LoginInput
          inputType='email'
          setValue={setEmail}
          submit={onEnter}
          ref={emailRef}
        />
        <LoginInput
          inputType='password'
          setValue={setPassword}
          back={() => {
            emailRef.current?.focus();
          }}
          submit={onSubmit}
          ref={passwordRef}
        />
      </div>
      <Button
        className={styles.loginButton}
        text='로그인'
        onClick={onSubmit}
        disabled={loginMutation.isPending}
      />
    </div>
  )
}