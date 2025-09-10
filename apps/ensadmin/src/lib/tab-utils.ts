export const getTabId = (): string => {
  if (typeof window === "undefined") {
    return "server";
  }

  let tabId = sessionStorage.getItem("ensadmin:tabId");

  if (!tabId) {
    const name = window.name || "";

    if (name.startsWith("ensadmin:tab:")) {
      tabId = name.replace("ensadmin:tab:", "");
    } else {
      tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      window.name = `ensadmin:tab:${tabId}`;
    }

    sessionStorage.setItem("ensadmin:tabId", tabId);
  }

  return tabId;
};
