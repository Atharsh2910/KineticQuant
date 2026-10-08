class DeterministicEngine:
    @staticmethod
    def calculate_base_score(ledger: dict) -> dict:
        """
        Calculates the absolute financial health (Base) of the SME.
        Inputs: cash_on_hand, accounts_payable, accounts_receivable, inventory_holding_costs
        Output: Base Solvency Score (0-100) and CoT
        """
        cash = float(ledger.get("cash_on_hand", 0))
        ap = float(ledger.get("accounts_payable", 0))
        ar = float(ledger.get("accounts_receivable", 0))
        inventory_costs = float(ledger.get("inventory_holding_costs", 0))
        
        # Simple liquidity logic
        quick_assets = cash + ar
        current_liabilities = ap + inventory_costs
        
        if current_liabilities == 0:
            current_liabilities = 1 # prevent div zero
            
        quick_ratio = quick_assets / current_liabilities
        
        # Mapping quick ratio to a score 0-100
        # If ratio >= 2.0 -> 100
        # If ratio == 1.0 -> 50
        # If ratio == 0.0 -> 0
        base_score = min(max((quick_ratio / 2.0) * 100, 0), 100)
        
        cot = (
            f"Calculated Quick Ratio: {quick_ratio:.2f} based on Cash (${cash}) + AR (${ar}) "
            f"vs AP (${ap}) + Inventory Costs (${inventory_costs}). "
            f"Mapped to Base Score: {base_score:.2f}/100."
        )
        
        return {
            "base_score": base_score,
            "cot_explanation": cot
        }

