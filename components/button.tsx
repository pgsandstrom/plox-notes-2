const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <>
      <button
        {...props}
        style={{
          cursor: 'pointer',
          border: '#009fd1 1px solid',
          background: '#beebff',
          borderRadius: '5px',
          fontSize: '14px',
          lineHeight: '27px',
          padding: '0px 10px',
          ...props.style,
        }}
      />
    </>
  )
}

export default Button
