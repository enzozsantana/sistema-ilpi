import * as React from "react"
import { cn } from "cn"
import { Label as LabelPrimitive } from "radix-ui"

function formatLabelWithRedAsterisk(node: React.ReactNode): React.ReactNode {
  if (typeof node === 'string') {
    if (!node.includes('*')) return node
    const parts = node.split('*')
    return (
      <span className="inline-flex items-baseline">
        {parts.map((part, index) => {
          if (index === parts.length - 1) return part
          return (
            <React.Fragment key={index}>
              {part}
              <span
                className="text-red-500 dark:text-red-400 font-bold ml-0.5 select-none"
                aria-hidden="true"
              >
                *
              </span>
            </React.Fragment>
          )
        })}
      </span>
    )
  }

  if (React.isValidElement(node) && node.props && (node.props as any).children) {
    return React.cloneElement(node as React.ReactElement<any>, {
      children: React.Children.map((node.props as any).children, formatLabelWithRedAsterisk),
    })
  }

  return node
}

interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  required?: boolean
}

function Label({
  className,
  required,
  children,
  ...props
}: LabelProps) {
  let content: React.ReactNode = React.Children.map(children, formatLabelWithRedAsterisk)

  const textContent = React.Children.toArray(children).reduce<string>((acc, child) => {
    return typeof child === 'string' ? acc + child : acc
  }, '')

  if (required && !textContent.includes('*')) {
    content = (
      <>
        {content}
        <span
          className="text-red-500 dark:text-red-400 font-bold ml-0.5 select-none"
          aria-hidden="true"
        >
          *
        </span>
      </>
    )
  }

  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {content}
    </LabelPrimitive.Root>
  )
}

export { Label }
