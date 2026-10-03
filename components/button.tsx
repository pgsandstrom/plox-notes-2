import styles from "./button.module.css"

const Button = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={className === undefined ? styles.button : `${styles.button} ${className}`}
      {...props}
    />
  )
}

export default Button
