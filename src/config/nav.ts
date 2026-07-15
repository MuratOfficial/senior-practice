import {
  BookOpen,
  Code2,
  FlaskConical,
  LayoutDashboard,
  RefreshCw,
  Timer,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const navItems: NavItem[] = [
  {
    title: "Дашборд",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Прогресс и статистика подготовки",
  },
  {
    title: "Вопросы",
    href: "/questions",
    icon: BookOpen,
    description: "База теоретических вопросов с разборами",
  },
  {
    title: "Задачи",
    href: "/challenges",
    icon: Code2,
    description: "Практические задачи с автопроверкой",
  },
  {
    title: "Playground",
    href: "/playground",
    icon: FlaskConical,
    description: "Свободный редактор JS/TS/Python",
  },
  {
    title: "Повторение",
    href: "/review",
    icon: RefreshCw,
    description: "Spaced repetition: очередь на сегодня",
  },
  {
    title: "Mock-интервью",
    href: "/mock",
    icon: Timer,
    description: "Симуляция интервью с таймером",
  },
];
