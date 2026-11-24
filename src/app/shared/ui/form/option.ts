export interface UiOption<T = unknown> {
  value: T;
  label: string;
  disabled?: boolean;
}
