export const getTabId = (): string => {
  if (typeof window === "undefined") {
    return "server";
  }

  let tabId = sessionStorage.getItem("ensadmin:tabId");

  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("ensadmin:tabId", tabId);
  }

  return tabId;
};
