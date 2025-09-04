import styles from './ResultContainer.module.css';


function ResultRow({ section, textValue, value }: {
  section: string,
  textValue: string,
  value: number
}) {
  return (
    <div className={styles.resultRow}>
      <span>
        <h4>{section}:</h4>
        <span>{textValue}</span>
      </span>
      <div>
        <div style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

const PITCH_TEXTS = [
  '아쉬움',
  '조금 아쉬움',
  '보통',
  '좋음',
  '매우 좋음'
];

export default function ResultContainer({ result }: { result: Result | null }) {

  return (
    <div className={styles.resultContainer}>
      {result && <>
        <h3>AI 분석 결과</h3>
        <div>
          <div className={styles.resultRowContainer}>
            <ResultRow section='음정 정확도' textValue={`${result.pitch}%`} value={result.pitch} />
            <ResultRow section='박자 정확도' textValue={`${result.rhythm}%`} value={result.rhythm} />
            <ResultRow section='감정 표현' textValue={PITCH_TEXTS[result.emotion-1]} value={result.emotion * 20} />
          </div>
          <span><h4>종합 점수</h4> : <span>{'★'.repeat(Math.min(Math.floor(result.total / 20 + 1), 5))}</span> ({result.total}점)</span>
          <div className={styles.resultEvaluation}>
            <span><h4>심사평:</h4> "{result.content}"</span>
          </div>
        </div>
      </>}
    </div>
  )
}