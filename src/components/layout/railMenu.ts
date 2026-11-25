import { AppIconName } from "@/components/ui/icons";

export interface RailMenuItem {
  label: string;
  icon: AppIconName;
  /** 跳转的路径；和 action 二选一 */
  to?: string;
  action?: () => void;
  danger?: boolean;
}
