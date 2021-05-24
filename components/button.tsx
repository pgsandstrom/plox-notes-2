const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <>
      <button {...props} />
      <style jsx>{`
        button {
          cursor: pointer;
          border: #009fd1 1px solid;
          background: #beebff;
          border-radius: 5px;
          font-size: 14px;
          line-height: 27px;
          padding: 0px 10px;
        }

        button:focus {
          background: #129cd9;
        }

        button:disabled {
          background: #6666666e;
        }
      `}</style>
    </>
  )
}

export default Button
