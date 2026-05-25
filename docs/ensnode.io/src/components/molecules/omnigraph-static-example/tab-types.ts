export interface StaticExampleTab {
  id: string;
  label: string;
  icon?: string;
}

export interface StaticExampleTabPanel {
  id: string;
  code: string;
  lang: string;
  maxHeight: string;
  visible?: boolean;
}
