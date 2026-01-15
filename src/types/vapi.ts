// Conajra Solutions © 2026
// Author: Marwan

// this is like a .h in C

// this will grow. each function will need it's own interface
export type vapi_function_name =
  | "book_appointment"
  | "check_availability"
  | "flag_for_human";

// a vapi function call represents a request to invoke a specific function
// TODO: ryan should fill this in wiht more detail
export interface vapi_function_call 
{
  function_name: vapi_function_name;
  parameters: unknown;
}
