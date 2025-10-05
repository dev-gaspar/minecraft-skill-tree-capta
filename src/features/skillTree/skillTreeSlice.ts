import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RawSkillNode, NormalizedSkillNode, SkillTreeState } from './skillTreeTypes';

const initialState: SkillTreeState = {
    nodes: {},
    rootId: null,
    loading: false,
    error: null,
};

// Genera un ID único basado en el nombre y nivel del nodo
function generateId(name: string, level: number): string {
    return `${name.toLowerCase().replace(/\s+/g, '-')}-${level}`;
}

// Calcula el ancho total del subárbol (número de nodos hoja)
function calculateTreeWidth(node: RawSkillNode): number {
    if (node.children.length === 0) return 1;
    return node.children.reduce((sum, child) => sum + calculateTreeWidth(child), 0);
}

// Normaliza el árbol en una estructura plana para Redux (Layout Horizontal)
export function normalizeSkillTree(
    node: RawSkillNode,
    parent: string | null = null,
    level: number = 0,
    yOffset: number = 0
): Record<string, NormalizedSkillNode> {
    const id = generateId(node.name, level);
    const normalized: Record<string, NormalizedSkillNode> = {};

    // Constantes para el layout horizontal
    const HORIZONTAL_SPACING = 80; // Espacio horizontal entre niveles (izquierda a derecha)
    const VERTICAL_SPACING = 70; // Espacio vertical entre nodos hermanos

    // Calcular la altura del subárbol
    const treeHeight = calculateTreeWidth(node); // Reutilizamos la función pero ahora es "altura"

    // Calcular la posición (horizontal = nivel, vertical = centrado en subárbol)
    const x = level * HORIZONTAL_SPACING + 50; // Offset inicial de 50px desde la izquierda
    const y = yOffset + (treeHeight * VERTICAL_SPACING) / 2;

    // Agregar el nodo actual
    normalized[id] = {
        id,
        name: node.name,
        description: node.description,
        image: node.image,
        children: node.children.map(child => generateId(child.name, level + 1)),
        parent,
        completed: false,
        level,
        position: { x, y },
    };

    // Procesar recursivamente todos los hijos
    let currentYOffset = yOffset;
    node.children.forEach((child) => {
        const childHeight = calculateTreeWidth(child);
        const childNodes = normalizeSkillTree(child, id, level + 1, currentYOffset);
        Object.assign(normalized, childNodes);
        currentYOffset += childHeight * VERTICAL_SPACING;
    });

    return normalized;
}

// Thunk para cargar el árbol de habilidades desde una URL
export const fetchSkillTree = createAsyncThunk(
    'skillTree/fetch',
    async (url: string, { rejectWithValue }) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: RawSkillNode = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : 'Error al cargar el árbol de habilidades'
            );
        }
    }
);

const skillTreeSlice = createSlice({
    name: 'skillTree',
    initialState,
    reducers: {
        // Alterna el estado de completado de un nodo (logro)
        toggleAchievement: (state, action: PayloadAction<string>) => {
            const nodeId = action.payload;
            const node = state.nodes[nodeId];

            if (!node) return;

            // Verificar que el padre esté completado antes de permitir completar
            if (node.parent && !state.nodes[node.parent]?.completed) {
                return;
            }

            // Alternar estado de completado
            node.completed = !node.completed;

            // Si se desmarca, desmarcar también todos los hijos recursivamente
            if (!node.completed) {
                const uncompleteChildren = (id: string) => {
                    const currentNode = state.nodes[id];
                    if (currentNode) {
                        currentNode.completed = false;
                        currentNode.children.forEach(uncompleteChildren);
                    }
                };
                node.children.forEach(uncompleteChildren);
            }
        },

        // Reinicia el estado del árbol
        resetSkillTree: (state) => {
            Object.values(state.nodes).forEach(node => {
                node.completed = false;
            });
        },

        // Completa un nodo y todos sus ancestros
        completeWithParents: (state, action: PayloadAction<string>) => {
            const nodeId = action.payload;
            let currentNode = state.nodes[nodeId];

            if (!currentNode) return;

            // Completar todos los ancestros primero
            while (currentNode.parent) {
                const parentNode = state.nodes[currentNode.parent];
                if (parentNode) {
                    parentNode.completed = true;
                    currentNode = parentNode;
                } else {
                    break;
                }
            }

            // Finalmente completar el nodo objetivo
            state.nodes[nodeId].completed = true;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSkillTree.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSkillTree.fulfilled, (state, action) => {
                state.loading = false;
                const normalizedNodes = normalizeSkillTree(action.payload);
                state.nodes = normalizedNodes;
                // El primer nodo es siempre la raíz (nivel 0)
                state.rootId = Object.values(normalizedNodes).find(node => node.level === 0)?.id || null;
            })
            .addCase(fetchSkillTree.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Error desconocido';
            });
    },
});

export const { toggleAchievement, resetSkillTree, completeWithParents } = skillTreeSlice.actions;

export default skillTreeSlice.reducer;
