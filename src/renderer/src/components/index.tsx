export function Button({ className, text = '', onClick = () => { }, disabled = false }: {
  className?: string,
  text?: string,
  onClick?: () => void,
  disabled?: boolean
}) {
  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      <span>{text}</span>
    </button>
  )
}