import { motion } from "framer-motion";
import React from "react";
import "../css/AnimatedButton.css";

interface AnimatedButtonProps {
	text?: string;
	onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
	disabled?: boolean;
	variant?: "add" | "remove" | "make-route" | "default";
	className?: string;
	style?: React.CSSProperties;
	isLoading?: boolean;
	loadingText?: string;
	spinner?: React.ReactNode;
}

const AnimatedButton = ({
	text = "Click",
	onClick,
	disabled = false,
	variant = "default",
	className = "",
	isLoading = false,
	spinner = <span className="spinner" style={{ marginRight: "0.5rem" }}></span>,
}: AnimatedButtonProps) => {
	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (!disabled && !isLoading) onClick(e);
	};

	return (
		<motion.button
			whileHover={{ scale: disabled || isLoading ? 1 : 1.025 }}
			whileTap={{ scale: disabled || isLoading ? 1 : 0.975 }}
			onClick={handleClick}
			disabled={disabled || isLoading}
			className={`encrypt-style-button ${variant} ${isLoading ? "loading" : ""} ${disabled || isLoading ? "disabled" : ""} ${className}`}
		>
			<div className="button-content">
				{isLoading ? (
					<>
						{spinner}
						<span>Loading...</span>
					</>
				) : (
					<span>{text}</span>
				)}
			</div>

			<motion.span
				initial={{ y: "100%" }}
				animate={{ y: "-100%" }}
				transition={{
					repeat: Infinity,
					repeatType: "mirror",
					duration: 1,
					ease: "linear",
				}}
				className="button-gradient"
			/>
		</motion.button>
	);
};

export default AnimatedButton;
