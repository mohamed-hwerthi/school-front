import { Toaster as Sonner, toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:font-[var(--font-body)]",
          title: "group-[.toast]:font-semibold group-[.toast]:text-[0.875rem]",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[0.8125rem]",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:text-xs group-[.toast]:px-3 group-[.toast]:py-1.5",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:text-xs",
          closeButton:
            "group-[.toast]:bg-background group-[.toast]:text-muted-foreground group-[.toast]:border-border group-[.toast]:hover:text-foreground",
          success:
            "group-[.toaster]:border-emerald-200 group-[.toaster]:dark:border-emerald-800/40",
          error:
            "group-[.toaster]:border-red-200 group-[.toaster]:dark:border-red-800/40",
          warning:
            "group-[.toaster]:border-amber-200 group-[.toaster]:dark:border-amber-800/40",
          info:
            "group-[.toaster]:border-blue-200 group-[.toaster]:dark:border-blue-800/40",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
