# Chaathan v2.0: The Twin Terror Update

This document outlines the planned changes for the major "PvE Survival" overhaul of Chaathan.

## 🌟 Core Concept Changes
The game is shifting from an **Asymmetric PvP** (1v3) to a **Co-op Survival Horror** (4 Players vs AI).

### 👥 The Enemy: Twin Chaathans
-   **No Human Chaathan**: The Chaathan is no longer a playable role.
-   **Twin AI**: Two (2) AI-controlled Chaathans patrol the mansion simultaneously.
-   **Behavior**:
    -   **Patrol**: They roam randomly between rooms.
    -   **Hunt**: If they spot a Poojari (line of sight), they chase relentlessly.
    -   **Touch of Death**: Physical contact with a Chaathan causes immediate loss of 1 Life (Talisman) and respawns the player.

---

## 🕯️ Survival Mechanics

### ❤️ The Three Talismans (Lives)
-   Every Poojari starts with **3 Talismans** (Lives).
-   **Losing a Life**: You lose a life if:
    1.  A Chaathan catches you.
    2.  Your Light Aura fully depletes.
-   **Respawn**: Losing a life respawns you at a random safe location with full Aura.
-   **Permadeath**: If you lose all 3 Talismans, you **Die Permanently**. You become a ghost/spectator and can only watch.
-   **Game Over**: If ALL Poojaris die, the Chaathans win.

### ✨ Light Aura (Sanity/Time)
-   Players have a **Light Aura** meter that slowly depletes over time.
-   **The Threat**: If the meter hits 0%, you succumb to the darkness (Loss of 1 Life).
-   **Refueling**: Interacting with any **LIT Lamp** restores your Aura to 100%.

---

## 📜 New Game Loop & Win Conditions

### Phase 1: The Four Flames
-   **Objective**: Poojaris must find and light **4 Mini Lamps** scattered across the map.
-   **Coordination**: Players must split up to find lamps while managing their Aura and avoiding the Twin Chaathans.

### Phase 2: The Final Ritual
-   **Trigger**: Once 4 lamps are lit, the **Grand Lamp** (Central Room) activates.
-   **The Stand**: All surviving Poojaris must gather at the Grand Lamp's ritual circle.
-   **Win Condition**: Hold the circle for **10 Seconds** to banish the Chaathans and win.

---

## 🗺️ Summary of Changes

| Feature | Old Version (v1) | New Version (v2) |
| :--- | :--- | :--- |
| **Enemy** | 1 Human Player | **2 AI Bots (Twin Chaathans)** |
| **Role** | 1v3 Asymmetric | **4 Player Co-op** |
| **Survival** | Time Limit | **Light Aura (Decays)** |
| **Health** | No Health (Stun/Push only) | **3 Lives (Permadeath)** |
| **Lamps** | 3 Lamps (Fixed) | **4 Lamps (Refuel Stations)** |
| **Win Cond.** | Light 3 -> Circle | **Light 4 -> Activate Center -> Circle** |
| **Chaathan** | Can Extinguish/Sabotage | **Hunter Only (Cannot extinguish)** |
