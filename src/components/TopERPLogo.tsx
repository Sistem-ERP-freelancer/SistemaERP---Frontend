import { cn } from "@/lib/utils";

interface TopERPLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
  variant?: "sidebar" | "landing";
}

export const TopERPLogo = ({ className, showText = false, textClassName, variant = "sidebar" }: TopERPLogoProps) => {
  const logoSrc = variant === "sidebar" ? "/logobranca.png" : "/logo.png";
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src={logoSrc} 
        alt="TopERP Logo" 
        className="h-40 w-auto object-contain"
      />
      {showText && (
        <span className={cn("text-xl font-bold", textClassName || "text-foreground")}>
          TopERP
        </span>
      )}
    </div>
  );
};
