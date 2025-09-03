import { useState, useCallback, useEffect } from "react";
import { getAudioInputDevices } from "../../../services";
import Select from "react-select";
import styles from './AudioInputSelector.module.css'


export default function AudioInputSelector({ audioInputDevice, setAudioInputDevice }: {
  audioInputDevice: MediaDeviceInfo | null,
  setAudioInputDevice: React.Dispatch<React.SetStateAction<MediaDeviceInfo | null>>
}) {

  const [audioInputDeviceList, setAudioInputDeviceList] = useState<MediaDeviceInfo[]>([]);
  const setAudioInputDeviceList_ = useCallback(() => {
    getAudioInputDevices().then((devices) => {
      setAudioInputDeviceList(devices);
    });
  }, []);
  useEffect(() => {
    setAudioInputDeviceList_();
  }, []);

  return (
    <Select
      id='audioInputSelector'
      className={styles.audioInputSelector}
      value={audioInputDevice}
      onMenuOpen={setAudioInputDeviceList_}
      onChange={(value) => {
        const info = audioInputDeviceList.find(x => x.label === value?.label);
        setAudioInputDevice(info ?? null);
      }}
      options={audioInputDeviceList}
      styles={{
        control: (styles, props) => {
          return {
            ...styles,
            outline: '0.5px solid #aaaaaa',
            border: 'none',
            outlineColor: props.isFocused ? 'var(--highlight)' : '#aaaaaa'
          }
        },
        option: (styles, props) => {
          const backgroundColor = props.isFocused ? 'var(--highlight)' : '#ffffff';
          const color = '#000000';
          return {
            ...styles,
            backgroundColor,
            color
          }
        }
      }}
    />
  )
}