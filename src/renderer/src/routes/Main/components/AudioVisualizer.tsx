import { useRef, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.js";
import styles from './AudioVisualizer.module.css';


export default function AudioVisualizer({ deviceId }: {
  deviceId: string | null
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const recordPluginRef = useRef<RecordPlugin | null>(null);

  useEffect(() => {
    if (!containerRef.current || !deviceId) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#0000ff",
      interact: false,
      cursorWidth: 0,
      barWidth: 1,
      height: 'auto',
    });
    wavesurferRef.current = ws;

    const record = ws.registerPlugin(RecordPlugin.create());
    recordPluginRef.current = record;

    record.startMic({
      deviceId: { exact: deviceId },
    });

    return () => {
      record.stopRecording();
      ws.destroy();
    };
  }, [deviceId]);

  return (
    <div className={styles.audioVisualizer} ref={containerRef} />
  )
}