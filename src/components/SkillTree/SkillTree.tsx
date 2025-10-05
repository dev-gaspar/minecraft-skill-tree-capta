import { useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchSkillTree } from "../../features/skillTree/skillTreeSlice";
import Achievement from "../Achievement/Achievement";

import styles from "./SkillTree.module.css";

const SKILL_TREE_URL = "https://minecraft.capta.co/BaseSkillTree.json";

function SkillTree() {
	const dispatch = useAppDispatch();
	const { nodes, rootId, loading, error } = useAppSelector(
		(state) => state.skillTree
	);

	console.log(nodes);

	useEffect(() => {
		dispatch(fetchSkillTree(SKILL_TREE_URL));
	}, [dispatch]);

	if (loading) {
		return (
			<div className={styles.loadingContainer}>
				<div className={styles.loading}>Cargando árbol de logros...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={styles.errorContainer}>
				<div className={styles.error}>Error al cargar el árbol de logros</div>
			</div>
		);
	}

	if (!rootId) {
		return (
			<div className={styles.emptyContainer}>
				<div className={styles.empty}>No hay datos disponibles</div>
			</div>
		);
	}

	// Calcular dimensiones del árbol
	const allNodes = Object.values(nodes);
	const maxX = Math.max(...allNodes.map((n) => n.position.x), 0);
	const maxY = Math.max(...allNodes.map((n) => n.position.y), 0);

	const padding = 150;
	const treeWidth = maxX + padding * 2;
	const treeHeight = maxY + padding * 2;

	return (
		<div className={styles.transformWrapper}>
			<TransformWrapper
				initialScale={0.8}
				minScale={0.1}
				maxScale={10}
				limitToBounds={false}
				centerOnInit={true}
				centerZoomedOut={true}
				wheel={{ step: 0.1 }}
			>
				<TransformComponent
					wrapperClass={styles.transformComponentWrapper}
					contentClass={styles.transformContent}
				>
					<div
						className={styles.treeContainer}
						style={{ width: treeWidth, height: treeHeight }}
					>
						{/* SVG para las conexiones */}
						<svg
							className={styles.connections}
							width={treeWidth}
							height={treeHeight}
						>
							{Object.values(nodes).map((node) =>
								node.children.map((childId) => {
									const child = nodes[childId];
									if (!child) return null;

									// Calcular punto medio horizontal para la línea en ángulo recto
									const midX =
										(node.position.x + padding + child.position.x + padding) /
										2;

									// Path con líneas rectas: horizontal -> vertical -> horizontal
									const pathData = `
										M ${node.position.x + padding} ${node.position.y + padding}
										L ${midX} ${node.position.y + padding}
										L ${midX} ${child.position.y + padding}
										L ${child.position.x + padding} ${child.position.y + padding}
									`;

									return (
										<g key={`${node.id}-${childId}`}>
											<path
												d={pathData}
												stroke="#000"
												strokeWidth={5}
												fill="none"
												className={styles.connectionLine}
											/>
											<path
												d={pathData}
												stroke={node.completed ? "#ffd700" : "#D3D3D3"}
												strokeWidth={3}
												fill="none"
												className={styles.connectionLine}
											/>
										</g>
									);
								})
							)}
						</svg>

						{Object.values(nodes).map((node) => (
							<Achievement
								key={node.id}
								nodeId={node.id}
								offsetX={padding}
								offsetY={padding}
							/>
						))}
					</div>
				</TransformComponent>
			</TransformWrapper>
		</div>
	);
}

export default SkillTree;
