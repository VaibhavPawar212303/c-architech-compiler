export interface StackFrame {
  id: string;
  functionName: string;
  variables: Variable[];
}

export interface Variable {
  id: string;
  name: string;
  type: 'value' | 'pointer' | 'struct' | 'array';
  value: string;
  address: string;
  size: number;
  targetId?: string;
  isMember?: boolean;
}

export interface HeapObject {
  id: string;
  name: string;
  size: number;
  type: 'struct' | 'array' | 'image';
  color: string;
  address: string;
  value: string;
  /** true once free() has run on this block; it stays on screen as a freed block */
  freed?: boolean;
}

export interface PointerLink {
  fromId: string;
  toId: string;
  color: string;
}

export interface LoopState {
  type: 'for' | 'while';
  startLine: number;
  condition: string;
  increment?: string;
  bodyEndLine: number;
}
