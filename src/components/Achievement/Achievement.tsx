import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { toggleAchievement } from "../../features/skillTree/skillTreeSlice";
import styles from "./Achievement.module.css";

interface AchievementProps {
	nodeId: string;
	offsetX?: number;
	offsetY?: number;
}

function Achievement({ nodeId, offsetX = 0, offsetY = 0 }: AchievementProps) {
	const dispatch = useAppDispatch();
	const node = useAppSelector((state) => state.skillTree.nodes[nodeId]);
	const [showTooltip, setShowTooltip] = useState(false);

	if (!node) return null;

	const canComplete =
		!node.parent ||
		useAppSelector((state) => state.skillTree.nodes[node.parent!]?.completed);

	const handleClick = () => {
		if (canComplete) {
			dispatch(toggleAchievement(nodeId));
		}
	};

	const achievementClasses = [
		styles.achievement,
		node.completed ? styles.completed : "",
		!canComplete ? styles.locked : "",
	]
		.filter(Boolean)
		.join(" ");

	const wrapperStyle = {
		left: `${node.position.x + offsetX}px`,
		top: `${node.position.y + offsetY}px`,
	};

	return (
		<div className={styles.wrapper} style={wrapperStyle}>
			<button
				className={achievementClasses}
				onClick={handleClick}
				onMouseEnter={() => setShowTooltip(true)}
				onMouseLeave={() => setShowTooltip(false)}
				disabled={!canComplete}
			>
				<img src={node.image} alt={node.name} className={styles.image} />
			</button>

			{showTooltip && (
				<div className={styles.tooltip}>
					<div className={styles.tooltipTitle}>{node.name}</div>
					<div className={styles.tooltipDescription}>{node.description}</div>
				</div>
			)}
		</div>
	);
}

export default Achievement;
