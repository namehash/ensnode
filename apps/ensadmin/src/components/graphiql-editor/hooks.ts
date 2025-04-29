import { useReducer } from "react";

type Query = string;
type Variables = string;

type EditorState = {
  query: Query;
  variables?: Variables;
};

type Action =
  | {
      type: "setQuery";
      payload: string;
    }
  | {
      type: "setQueryAndVariables";
      payload: {
        query: Query;
        variables: Variables;
      };
    };

function reducer(state: EditorState, action: Action) {
  switch (action.type) {
    case "setQuery":
      return { ...state, query: action.payload, variables: undefined };
    case "setQueryAndVariables":
      return {
        ...state,
        query: action.payload.query,
        variables: action.payload.variables,
      };
  }
}

const initialState: EditorState = {
  query: "",
};

export function useGraphiQLEditor() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return {
    state,
    actions: {
      setQuery: (query: Query) => {
        dispatch({ type: "setQuery", payload: query });
      },
      setQueryAndVariables: (query: Query, variables: Variables) => {
        dispatch({
          type: "setQueryAndVariables",
          payload: { query, variables },
        });
      },
    },
  };
}
