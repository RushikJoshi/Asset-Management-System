import { createContext, useCallback, useContext, useState, useRef } from "react";

const TopbarActionsContext = createContext({
  actions: null,
  setActions: () => {},
});

export function TopbarActionsProvider({ children }) {
  const [actions, setActionsState] = useState(null);
  const actionsRef = useRef(null);
  const setActions = useCallback((a) => {
    // Avoid state update if actions are unchanged (prevents render loop)
    if (a && actionsRef.current && a.onReset === actionsRef.current.onReset && a.onSave === actionsRef.current.onSave) {
      return;
    }
    actionsRef.current = a;
    setActionsState(a);
  }, []);
  return (
    <TopbarActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </TopbarActionsContext.Provider>
  );
}

export function useTopbarActions() {
  return useContext(TopbarActionsContext);
}
