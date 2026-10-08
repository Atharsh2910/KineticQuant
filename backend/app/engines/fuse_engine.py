class FuseEngine:
    @staticmethod
    def calculate_fuse(base_score: float, delta_score: float, sentiment_multiplier: float) -> dict:
        """
        Calculates the final Fuse Score.
        Formula: Fuse Score = (Base + Delta) * Multiplier
        """
        raw_score = base_score + delta_score
        # Ensure raw score doesn't drop below 0 before multiplier
        raw_score = max(raw_score, 0)
        
        fuse_score = raw_score * sentiment_multiplier
        
        # Cap final score at 100
        fuse_score = min(fuse_score, 100.0)
        
        cot = (
            f"Fuse Score Calculation: (Base: {base_score:.2f} + Delta: {delta_score:.2f}) "
            f"* Sentiment Multiplier: {sentiment_multiplier:.2f} = {fuse_score:.2f}."
        )
        
        return {
            "fuse_score": fuse_score,
            "cot_explanation": cot
        }

