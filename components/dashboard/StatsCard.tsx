import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number | string
    isPositive?: boolean
    label?: string
  }
  color?: "blue" | "green" | "orange" | "purple" | "red" | "indigo"
  description?: string
}

const colorConfig = {
  blue: {
    gradient: "from-blue-500 via-blue-600 to-blue-700",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
    shadowColor: "shadow-blue-500/20",
    textColor: "text-blue-700",
  },
  green: {
    gradient: "from-emerald-500 via-emerald-600 to-teal-700",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    shadowColor: "shadow-emerald-500/20",
    textColor: "text-emerald-700",
  },
  orange: {
    gradient: "from-orange-500 via-orange-600 to-amber-700",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-600",
    borderColor: "border-orange-200",
    shadowColor: "shadow-orange-500/20",
    textColor: "text-orange-700",
  },
  purple: {
    gradient: "from-purple-500 via-purple-600 to-violet-700",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-600",
    borderColor: "border-purple-200",
    shadowColor: "shadow-purple-500/20",
    textColor: "text-purple-700",
  },
  red: {
    gradient: "from-red-500 via-red-600 to-rose-700",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-600",
    borderColor: "border-red-200",
    shadowColor: "shadow-red-500/20",
    textColor: "text-red-700",
  },
  indigo: {
    gradient: "from-indigo-500 via-indigo-600 to-blue-700",
    iconBg: "bg-indigo-500/20",
    iconColor: "text-indigo-600",
    borderColor: "border-indigo-200",
    shadowColor: "shadow-indigo-500/20",
    textColor: "text-indigo-700",
  },
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = "blue",
  description 
}: StatsCardProps) {
  const config = colorConfig[color]

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all duration-300",
      "hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1",
      config.borderColor,
      config.shadowColor,
      "shadow-lg"
    )}>
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-5",
        config.gradient
      )} />
      
      {/* Decorative Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div className={cn(
          "absolute inset-0 rounded-full blur-3xl bg-gradient-to-br",
          config.gradient
        )} />
      </div>

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className={cn(
              "text-sm font-medium mb-1 uppercase tracking-wide",
              config.textColor,
              "opacity-70"
            )}>
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <p className={cn(
                "text-4xl font-bold tracking-tight",
                config.textColor
              )}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
            {trend && (
              <div className="flex items-center gap-1.5 mt-3">
                {typeof trend.value === 'number' && trend.isPositive !== undefined && (
                  <span className={cn(
                    "text-xs font-semibold flex items-center gap-1",
                    trend.isPositive ? "text-emerald-600" : "text-red-600"
                  )}>
                    {trend.isPositive ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {Math.abs(trend.value)}%
                  </span>
                )}
                {trend.label && (
                  <span className="text-xs text-muted-foreground">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Icon Container */}
          <div className={cn(
            "relative p-4 rounded-2xl transition-transform duration-300",
            "hover:scale-110 hover:rotate-6",
            config.iconBg
          )}>
            <div className={cn(
              "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-20 blur-xl",
              config.gradient
            )} />
            <Icon className={cn(
              "relative w-8 h-8",
              config.iconColor
            )} />
          </div>
        </div>

        {/* Bottom Accent Line */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r",
          config.gradient
        )} />
      </div>
    </Card>
  )
}
