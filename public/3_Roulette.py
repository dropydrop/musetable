import random
import streamlit as st
#from streamlit_space import space
import pandas as pd

#st.set_page_config(page_title="Roulette de casino", page_icon="🎡")

st.set_page_config(
        page_title="Roulette de casino",
        page_icon="🎡",
        layout="wide"  # important pour utiliser toute la largeur
        )

st.markdown(
    """
    <style>
    .stAlert {
        text-align: center;
    }
    </style>
    """,
    unsafe_allow_html=True
)

st.markdown("""
<style>
.stApp {padding-top: 0; margin-top: 0px; }
.stAppViewBlockContainer {
padding-top: 0rem;
}
div.block-container {padding-top: 0; }
</style>
""", unsafe_allow_html=True)

# =====================
# CONSTANTES
# =====================
START_MONEY = 1000
HISTORY_WINDOW = 7

DOZENS = {
    "1": range(1, 13),
    "2": range(13, 25),
    "3": range(25, 37)
}

THEORETICAL_PROBAS = {
    "1": 1 / 37 * 100,     # Numéro exact
    "2": 18 / 37 * 100,    # Couleur
    "3": 18 / 37 * 100,    # Pair / Impair
    "4": 12 / 37 * 100     # Douzaine
}

# =====================
# FONCTIONS METIER
# =====================
def get_couleur(numero: int) -> str:
    if numero == 0:
        return "vert"
    return "noir" if numero % 2 == 0 else "rouge"


def estimation_historique(pari, valeur, historique):
    derniers = historique[-HISTORY_WINDOW:]

    total = 0
    succes = 0

    for numero, couleur in derniers:
        if numero == 0:
            continue

        total += 1

        if pari == "1" and numero == valeur:
            succes += 1
        elif pari == "2" and couleur == valeur:
            succes += 1
        elif pari == "3" and numero % 2 == valeur:
            succes += 1
        elif pari == "4" and numero in DOZENS[valeur]:
            succes += 1

    if total == 0:
        return None

    return succes / total * 100


def calcul_gain(pari, valeur, mise, numero_gagnant):
    couleur = get_couleur(numero_gagnant)

    if pari == "1":  # Numéro exact
        return mise * 35 if numero_gagnant == valeur else -mise

    if numero_gagnant == 0:
        return -mise

    if pari == "2":  # Couleur
        return mise if couleur == valeur else -mise

    if pari == "3":  # Pair / Impair
        return mise if numero_gagnant % 2 == valeur else -mise

    if pari == "4":  # Douzaine
        return mise * 2 if numero_gagnant in DOZENS[valeur] else -mise


# =====================
# INITIALISATION SESSION_STATE
# =====================
def init_state():
    if "argent" not in st.session_state:
        st.session_state.argent = START_MONEY
    if "historique" not in st.session_state:
        st.session_state.historique = []
    if "last_result" not in st.session_state:
        st.session_state.last_result = None
    if "game_over" not in st.session_state:
        st.session_state.game_over = False


# =====================
# APP STREAMLIT
# =====================
def main():
    init_state()

    st.title("🎡 Roulette de casino")

    # Ligne des métriques globales
    top_col1, top_col2, top_col3 = st.columns([1, 1, 1])
    with top_col1:
        st.metric("💰 Argent disponible", f"{st.session_state.argent} €")
    with top_col2:
        st.metric("💸 Solde de départ", f"{START_MONEY} €")
    with top_col3:
        if st.session_state.historique:
            st.metric("🎡 Nombre de tirages", len(st.session_state.historique))
        else:
            st.metric("🎡 Nombre de tirages", 0)

    # Gestion fin de partie
    if st.session_state.game_over or st.session_state.argent <= 0:
        st.warning("🏁 Fin de partie : vous n'avez plus d'argent.")
        if st.button("🔄 Recommencer une nouvelle partie"):
            for k in list(st.session_state.keys()):
                del st.session_state[k]
            init_state()
            st.rerun()
        return

    # ==========================
    # ZONE PRINCIPALE EN 3 COLONNES
    # ==========================
    col_left, col_center, col_right = st.columns([1.1, 1, 1.2])

    # --------- COLONNE GAUCHE : CONFIG PARI ---------
    with col_left:
        st.subheader("🎯 Type de pari")

        # Type de pari
        type_pari = st.radio("",
            label_visibility="collapsed",
            options=["2", "3", "4", "1"],
            format_func=lambda x: {
                "2": "Couleur",
                "3": "Pair / Impair",
                "4": "Douzaine",
                "1": "Numéro exact"
            }[x],
            horizontal=False,
            key="type_pari"
        )

        st.caption(f"Chance théorique de gagner : **{THEORETICAL_PROBAS[type_pari]:.1f} %**")

        # Détail du pari
        if type_pari == "1":
            valeur_pari = st.number_input(
                "Numéro (0 à 36)",
                min_value=0, max_value=36, value=17, step=1,
                key="numero_exact"
            )
        elif type_pari == "2":
            opt_c = st.radio(
                "Choisissez la couleur",
                ["Rouge", "Noir"],
                horizontal=True,
                key="couleur"
            )
            valeur_pari = "rouge" if opt_c == "Rouge" else "noir"
        elif type_pari == "3":
            opt_pi = st.radio(
                "Pair ou Impair",
                ["Pair", "Impair"],
                horizontal=True,
                key="pair_impair"
            )
            valeur_pari = 0 if opt_pi == "Pair" else 1
        else:  # "4" Douzaine
            opt_d = st.radio(
                "Choisissez la douzaine",
                ["1 (1-12)", "2 (13-24)", "3 (25-36)"],
                horizontal=False,
                key="douzaine"
            )
            valeur_pari = opt_d[0]  # "1", "2" ou "3"

        # Mise
        mise = st.number_input(
            "Mise (€)",
            min_value=1,
            max_value=max(1, st.session_state.argent),
            value=min(10, st.session_state.argent),
            step=1,
            key="mise"
        )

    # --------- COLONNE CENTRALE : ACTION & DERNIER RÉSULTAT ---------
    with col_center:
        st.subheader("🎰 Lancer la roulette")

        jouer = st.button("🎡 Lancer un nouveau tirage", use_container_width=True)

        if jouer:
            if mise <= 0 or mise > st.session_state.argent:
                st.error("Mise invalide.")
            else:
                numero_gagnant = random.randint(0, 36)
                couleur_gagnante = get_couleur(numero_gagnant)

                gain = calcul_gain(type_pari, valeur_pari, mise, numero_gagnant)
                st.session_state.argent += gain
                st.session_state.historique.append((numero_gagnant, couleur_gagnante))

                st.session_state.last_result = {
                    "numero": numero_gagnant,
                    "couleur": couleur_gagnante,
                    "gain": gain,
                    "mise": mise
                }

                if st.session_state.argent <= 0:
                    st.session_state.game_over = True

                st.rerun()

        #st.subheader("Dernier tirage")
        #st.markdown("**Dernier tirage**")

        if st.session_state.last_result is not None:
            res = st.session_state.last_result

            # Carte de résultat
            with st.container():
                colr1, colr2 = st.columns(2)
                with colr1:
                    st.markdown(
                        f"<p style='text-align: center;'><b>Numéro gagnant</b></p>",
                        unsafe_allow_html=True
                    )
                    st.markdown(
                        f"<p style='text-align: center; margin: 0; font-size: 36px;'>{res['numero']}</p>",
                        unsafe_allow_html=True
                    )
                    st.markdown(
                        f"<p style='text-align: center;'><b>({res['couleur']})</b></p>",
                        unsafe_allow_html=True
                    )
                with colr2:
                    st.markdown(
                        f"<p style='text-align: center;'><b>Résultat financier</b></p>",
                        unsafe_allow_html=True
                    )
                    if res["gain"] > 0:
                        st.success(f"Gain : +{res['gain']} €")
                    else:
                        st.error(f"Perte : -{abs(res['gain'])} €")                       
                    st.markdown(
                        f"<p style='text-align: center;'><b>Mise : {res['mise']} €</b></p>",
                        unsafe_allow_html=True
                    )
#                   st.markdown(f"Argent après tirage : **{st.session_state.argent} €**")

        # Estimation historique
        st.markdown("##### 📊 Tendance historique")
        proba_hist = estimation_historique(type_pari, valeur_pari, st.session_state.historique)
        if proba_hist is None:
            st.info("Données insuffisantes")
        else:
            st.info(f"**{proba_hist:.1f} %** de {valeur_pari} sur les {HISTORY_WINDOW} derniers tirages")

    # --------- COLONNE DROITE : HISTORIQUE + CONTRÔLES ---------
    with col_right:
        st.subheader("📜 Historique des tirages")

        if st.session_state.historique:
            # Liste compacte
            st.markdown("**Derniers numéros :**")
            hist_str = " | ".join(
                f"{n} ({c})" for n, c in st.session_state.historique[-25:]
            )
            st.write(hist_str)

            # Vue tableau / stats
            with st.expander("Afficher l'historique complet (tableau)", expanded=False):
                df = pd.DataFrame(
                    st.session_state.historique,
                    columns=["Numéro", "Couleur"]
                )
                st.dataframe(df, use_container_width=True, height=300)

        else:
            st.info("Aucun tirage pour le moment")

        st.markdown("---")
        st.subheader("⚙️ Contrôles")

        col_ctrl1, col_ctrl2 = st.columns(2)
        with col_ctrl1:
            if st.button("🔄 Réinitialiser la partie", use_container_width=True):
                for k in list(st.session_state.keys()):
                    del st.session_state[k]
                init_state()
                st.rerun()
        with col_ctrl2:
            if st.button("🧹 Effacer l'historique", use_container_width=True):
                st.session_state.historique = []
                st.session_state.last_result = None
                st.rerun()


if __name__ == "__main__":
    main()
