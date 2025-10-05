// Estructura del árbol de habilidades sin procesar desde JSON
export interface RawSkillNode {
    name: string;
    description: string;
    image: string;
    children: RawSkillNode[];
}

// Estructura del árbol de habilidades normalizada para Redux
export interface NormalizedSkillNode {
    id: string;
    name: string;
    description: string;
    image: string;
    children: string[];
    parent: string | null;
    completed: boolean;
    level: number;
    position: { x: number; y: number };
}

// Estructura del estado de Redux
export interface SkillTreeState {
    nodes: Record<string, NormalizedSkillNode>;
    rootId: string | null;
    loading: boolean;
    error: string | null;
}
