export interface LinePart {
  type: 'co' | 'kw' | 'fn' | 'st' | 'nm' | 'op' | 'tx' | 'dim' | 'formula' | 'tag' | 'hl';
  text: string;
}

export interface LineData {
  ln: number;
  parts: LinePart[];
  badge?: {
    type: 'b-blue' | 'b-green' | 'b-amber' | 'b-red' | 'b-pink';
    text: string;
  };
  isSep?: boolean;
  matrix?: string[][];
}

export interface ExamInsight {
  title: string;
  content: string;
}

export interface SectionData {
  id: string;
  tabLabel: string;
  summary: string;
  insights: ExamInsight[];
  lines: LineData[];
}

export const mecaFluidesData: SectionData[] = [
  {
    id: 'ch1',
    tabLabel: 'Intro',
    summary: 'De la mécanique du point vers la MMC. Fondations et hypothèses de continuité.',
    insights: [
      { title: 'Hypothèse MMC', content: 'Le fluide est un continuum. Valide si l_micro << l (particule) << L_macro.' },
      { title: 'Niveaux de Description', content: 'Point (3 var) -> Solide Rigide (6 var) -> Milieu Déformable (12 var).' },
      { title: 'Deborah Number', content: 'De = Tr / Tp. De << 1 : Fluide (s\'écoule) ; De >> 1 : Solide (se déforme).' },
      { title: 'Particule Fluide', content: 'Volume "mésoscopique" contenant assez de molécules pour définir des moyennes (P, T, v).' },
      { title: 'Échelles', content: 'L\'échelle macroscopique L définit les gradients. L\'échelle microscopique est le libre parcours moyen.' }
    ],
    lines: [
      { ln: 1, parts: [{ type: 'co', text: '# ── CH1: FONDATIONS ET HYPOTHÈSE MMC ──────────────────────' }] },
      { ln: 2, parts: [{ type: 'kw', text: 'Particule' }, { type: 'tx', text: ' ' }, { type: 'hl', text: 'Matérielle' }, { type: 'tx', text: ' : Volume mésoscopique (l) tel que :' }] },
      { ln: 3, parts: [{ type: 'tx', text: '    l_micro (molécule) << l << L_macro (conduite).' }], badge: { type: 'b-green', text: 'Continuum' } },
      { ln: 4, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 5, parts: [{ type: 'co', text: '# Descriptions Cinématiques :' }] },
      { ln: 6, parts: [{ type: 'kw', text: 'Lagrangienne' }, { type: 'tx', text: ' : On suit une particule dans son mouvement.' }] },
      { ln: 7, parts: [{ type: 'tx', text: '    x = Φ(X, t) → On s\'intéresse à la trajectoire.' }] },
      { ln: 8, parts: [{ type: 'kw', text: 'Eulérienne' }, { type: 'tx', text: ' : On observe un point fixe de l\'espace.' }] },
      { ln: 9, parts: [{ type: 'tx', text: '    u = u(x, t) → On s\'intéresse au champ de vitesse.' }] },
      { ln: 10, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 11, parts: [{ type: 'co', text: '# Solide vs Fluide (Réponse à la contrainte) :' }] },
      { ln: 12, parts: [{ type: 'st', text: 'Solide' }, { type: 'tx', text: ' : Déformation ∝ Contrainte (s\'arrête de bouger).' }] },
      { ln: 13, parts: [{ type: 'st', text: 'Fluide' }, { type: 'tx', text: ' : Vitesse de déformation ∝ Contrainte (coule tant que...).' }] },
      { ln: 14, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 15, parts: [{ type: 'kw', text: 'Nombre' }, { type: 'tx', text: ' de ' }, { type: 'hl', text: 'Deborah (De)' }, { type: 'tx', text: ' = Tr / Tp' }], badge: { type: 'b-amber', text: '⭐ CONCEPT' } },
      { ln: 16, parts: [{ type: 'tx', text: '    Tr : Temps de relaxation du matériau.' }] },
      { ln: 17, parts: [{ type: 'tx', text: '    Tp : Temps d\'observation du phénomène.' }] },
      { ln: 18, parts: [{ type: 'tx', text: '    De << 1 : Fluide (dominance visqueuse) | De >> 1 : Solide (dominance élastique).' }] },
      { ln: 19, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 19, parts: [{ type: 'co', text: '# Cinématique du Solide Rigide (Pas de déform.) :' }] },
      { ln: 20, parts: [{ type: 'formula', text: '    v_A = v_B + Ω ∧ BA' }] },
      { ln: 21, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 22, parts: [{ type: 'co', text: '# Cinématique MMC (Déformable) :' }] },
      {
        ln: 23,
        parts: [{ type: 'kw', text: 'Gradient' }, { type: 'tx', text: ' de Vitesse (∇v) = D + R' }],
        matrix: [
          ['∂u/∂x', '∂u/∂y', '∂u/∂z'],
          ['∂v/∂x', '∂v/∂y', '∂v/∂z'],
          ['∂w/∂x', '∂w/∂y', '∂w/∂z']
        ]
      },
      { ln: 24, parts: [{ type: 'tx', text: ' ' }] },
      {
        ln: 25,
        parts: [{ type: 'nm', text: 'D (Symétrique)' }, { type: 'tx', text: ' : Taux de déformation (Shape change)' }],
        matrix: [
          ['∂u/∂x', '1/2(∂u/∂y+∂v/∂x)', '1/2(∂u/∂z+∂w/∂x)'],
          ['1/2(∂v/∂x+∂u/∂y)', '∂v/∂y', '1/2(∂v/∂z+∂w/∂y)'],
          ['1/2(∂w/∂x+∂u/∂z)', '1/2(∂w/∂y+∂v/∂z)', '∂w/∂z']
        ]
      },
      { ln: 26, parts: [{ type: 'tx', text: ' ' }] },
      {
        ln: 27,
        parts: [{ type: 'nm', text: 'R (Antisym.)' }, { type: 'tx', text: ' : Taux de rotation (Rigid spin)' }],
        matrix: [
          ['0', '1/2(∂u/∂y-∂v/∂x)', '1/2(∂u/∂z-∂w/∂x)'],
          ['1/2(∂v/∂x-∂u/∂y)', '0', '1/2(∂v/∂z-∂w/∂y)'],
          ['1/2(∂w/∂x-∂u/∂z)', '1/2(∂w/∂y-∂v/∂z)', '0']
        ]
      },
      { ln: 28, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 29, parts: [{ type: 'st', text: 'Dilatation' }, { type: 'tx', text: ' : (1/ω)dω/dt = tr(D) = div(v).' }], badge: { type: 'b-red', text: '⭐ IMPORTANT' } },
      { ln: 30, parts: [{ type: 'tx', text: '    div(v) = 0 → Fluide Incompressible.' }] },
    ],
  },
  {
    id: 'ch2',
    tabLabel: 'Cinématique',
    summary: 'Descriptions, Dérivée Particulaire, Théorème de Transport et Bilans de Masse.',
    insights: [
      { title: 'GPS vs Radar', content: 'Lagrange (GPS) suit X. Euler (Radar) regarde x fixe. Indispensable pour les déformations.' },
      { title: 'Stationnaire', content: 'En régime permanent, Trajectoires = Lignes de Courant = Lignes d\'Émission.' },
      { title: 'Incompressible', content: 'div(u) = 0 signifie que le volume d\'une particule est constant.' },
      { title: 'Ligne d\'Émission', content: 'Lieu des particules passées par un même point (ex: fumée). Différent de trajectoire si instationnaire.' },
      { title: 'Vorticité (ω)', content: 'ω = rot(u). Représente la rotation locale de la particule. ω = 2R (tenseur de rotation).' }
    ],
    lines: [
      { ln: 1, parts: [{ type: 'co', text: '# ── CH2: CINÉMATIQUE ET TRANSPORT ───────────────────────' }] },
      { ln: 2, parts: [{ type: 'kw', text: 'Dérivée' }, { type: 'tx', text: ' ' }, { type: 'hl', text: 'Particulaire' }, { type: 'tx', text: ' (Opérateur D/Dt) :' }], badge: { type: 'b-amber', text: '⭐ FONDAMENTAL' } },
      { ln: 3, parts: [{ type: 'formula', text: '    Dψ/Dt = ∂ψ/∂t + (u·∇)ψ' }] },
      { ln: 4, parts: [{ type: 'tx', text: '    - ∂ψ/∂t : Variation ' }, { type: 'hl', text: 'Locale' }, { type: 'tx', text: ' (Instationnarité).' }] },
      { ln: 5, parts: [{ type: 'tx', text: '    - (u·∇)ψ : Terme de ' }, { type: 'hl', text: 'Convection' }, { type: 'tx', text: ' (Transport advectif).' }] },
      { ln: 6, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 7, parts: [{ type: 'co', text: '# Théorème de Transport de Reynolds (RTT) :' }] },
      { ln: 8, parts: [{ type: 'tx', text: '    Relie la variation d\'un système à un volume de contrôle Ω :' }] },
      { ln: 9, parts: [{ type: 'formula', text: '    dB/dt = ∫_Ω (∂b/∂t) dτ + ∮_Σ (b * u·n) dS' }] },
      { ln: 10, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 11, parts: [{ type: 'co', text: '# Conservation de la Masse (Continuité) :' }] },
      { ln: 12, parts: [{ type: 'kw', text: 'Équation' }, { type: 'tx', text: ' locale : ' }, { type: 'formula', text: '∂ρ/∂t + div(ρu) = 0' }] },
      { ln: 13, parts: [{ type: 'tx', text: '    Si ρ = cte (Incomp.) → ' }, { type: 'formula', text: 'div(u) = 0' }] },
      { ln: 14, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 15, parts: [{ type: 'co', text: '# Caractéristiques de l\'Écoulement :' }] },
      { ln: 16, parts: [{ type: 'st', text: 'Lignes de Courant' }, { type: 'tx', text: ' : Tangentes à u à t fixe (Snapshot).' }] },
      { ln: 17, parts: [{ type: 'st', text: 'Trajectoires' }, { type: 'tx', text: ' : Chemin réel (dx/dt = u). Coïncident si stationnaire.' }] },
      { ln: 18, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 19, parts: [{ type: 'kw', text: 'Fonction' }, { type: 'tx', text: ' de Courant ψ (2D) :' }] },
      { ln: 20, parts: [{ type: 'formula', text: '    u = ∂ψ/∂y , v = −∂ψ/∂x' }] },
      { ln: 21, parts: [{ type: 'tx', text: '    ψ=Cte définit les lignes de courant. Q_AB = ψ_B - ψ_A.' }] },
      { ln: 22, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 23, parts: [{ type: 'kw', text: 'Note' }, { type: 'tx', text: ' : Indispensable pour visualiser les tourbillons (vorticité).' }] },
    ],
  },
  {
    id: 'ch3',
    tabLabel: 'Bilans',
    summary: 'Lois de conservation fondamentales. Intuition physique des forces et des transferts d\'énergie.',
    insights: [
      { title: 'σ Symmetry', content: 'σ_ij = σ_ji est prouvé par le bilan de moment cinétique (3.4). Indique l\'absence de couples volumiques.' },
      { title: 'Partition Énergie', content: 'L\'énergie totale est conservée, mais le frottement visqueux transforme Ec en Ei (chaleur).' },
      { title: 'Pression Statique', content: 'La pression p existe même au repos. τ n\'apparaît que si le fluide s\'écoule.' },
      { title: 'Vecteur Contrainte', content: 'T(n) = σ·n. C\'est la force surfacique réelle ressentie par une facette de normale n.' },
      { title: 'Th. Divergence', content: 'Utilisé pour passer du bilan global (intégrale surface) au bilan local (div).' }
    ],
    lines: [
      { ln: 1, parts: [{ type: 'co', text: '# ── INTRODUCTION AUX BILANS ──────────────────────────────' }] },
      { ln: 2, parts: [{ type: 'tx', text: 'On applique les lois de Newton à un volume de fluide déformable.' }] },
      { ln: 3, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 4, parts: [{ type: 'co', text: '# ── FORCES ET CONTRAINTES ──────────────────────────────' }] },
      { ln: 5, parts: [{ type: 'kw', text: 'Forces' }, { type: 'tx', text: ' Volumiques : Agissent sur la masse (ex: Pesanteur ρg).' }] },
      { ln: 6, parts: [{ type: 'kw', text: 'Forces' }, { type: 'tx', text: ' de Contact : Agissent sur la "peau" du volume (Tenseur σ).' }] },
      { ln: 7, parts: [{ type: 'tx', text: '    Le tenseur σ représente l\'état de contrainte interne du fluide.' }] },
      { ln: 8, parts: [{ type: 'kw', text: 'Décomposition' }, { type: 'tx', text: ' : ' }, { type: 'formula', text: 'σ = −pI + τ' }] },
      {
        ln: 9,
        parts: [{ type: 'tx', text: '    Tenseur des Contraintes (σ) :' }],
        matrix: [
          ['-p + τ_xx', 'τ_xy', 'τ_xz'],
          ['τ_yx', '-p + τ_yy', 'τ_yz'],
          ['τ_zx', 'τ_zy', '-p + τ_zz']
        ]
      },
      { ln: 10, parts: [{ type: 'tx', text: '    - Pression p : Effort normal, présent même au repos.' }] },
      { ln: 11, parts: [{ type: 'tx', text: '    - Cisaillement τ : Effort tangentiel dû aux effets visqueux.' }] },
      { ln: 12, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 13, parts: [{ type: 'co', text: '# ── QUANTITÉ DE MOUVEMENT ───────────────────────────────' }] },
      { ln: 14, parts: [{ type: 'st', text: 'Bilan Global' }, { type: 'tx', text: ' : Somme des forces = Accélération de la masse.' }] },
      { ln: 15, parts: [{ type: 'formula', text: '    ∫_Ω ∂(ρv)/∂t dτ + ∮_Σ ρv(v·n) dS = Force_vol + Force_surf' }] },
      { ln: 16, parts: [{ type: 'st', text: 'Cauchy' }, { type: 'tx', text: ' (Local) : La loi de Newton en chaque point du fluide :' }] },
      { ln: 17, parts: [{ type: 'formula', text: '    ρ Dv/Dt = ρf - ∇p + div(τ)' }], badge: { type: 'b-red', text: '⭐ IMPORTANT' } },
      { ln: 18, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 19, parts: [{ type: 'co', text: '# ── MOMENT CINÉTIQUE & SYMÉTRIE ─────────────────────────' }] },
      { ln: 20, parts: [{ type: 'tx', text: 'L\'absence de couples internes impose que le tenseur σ soit symétrique.' }] },
      { ln: 21, parts: [{ type: 'tx', text: '    C\'est une propriété fondamentale pour simplifier les calculs.' }] },
      { ln: 22, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 23, parts: [{ type: 'co', text: '# ── CONSERVATION DE L\'ÉNERGIE ───────────────────────────' }] },
      { ln: 24, parts: [{ type: 'kw', text: 'Énergie' }, { type: 'tx', text: ' Totale : Se conserve entre travail, chaleur et mouvement.' }] },
      { ln: 25, parts: [{ type: 'st', text: 'Bilan Ec' }, { type: 'tx', text: ' : Énergie mécanique. Diminuée par la dissipation visqueuse.' }] },
      { ln: 26, parts: [{ type: 'formula', text: '    ρ D(v²/2)/Dt = ρf·v + div(σ·v) - Φ' }] },
      { ln: 27, parts: [{ type: 'st', text: 'Dissipation Visqueuse Φ' }, { type: 'tx', text: ' : Le frottement visqueux "vole" de l\'énergie' }] },
      { ln: 28, parts: [{ type: 'tx', text: '    cinétique pour la transformer en chaleur (énergie interne).' }] },
      { ln: 29, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 30, parts: [{ type: 'kw', text: 'Note' }, { type: 'tx', text: ' : Ce chapitre pose les bases de Navier-Stokes (Ch4).' }] },
    ],
  },
  {
    id: 'ch4',
    tabLabel: 'N-S',
    summary: 'Le système complet pour les fluides Newtoniens. Loi de Newton et fermeture.',
    insights: [
      { title: 'Inconnues (9)', content: 'Vitesse (3), Pression (1), Température (1), ρ, f, r, e. Nécessite des lois constitutives.' },
      { title: 'Adhérence', content: 'Contrairement au fluide parfait, le fluide réel "colle" à la paroi (v_fluide = v_paroi).' },
      { title: 'Non-linéarité', content: 'Le terme (u·∇)u rend N-S extrêmement difficile à résoudre analytiquement.' },
      { title: 'Fluide Newtonien', content: 'Fluide où la contrainte τ est linéairement proportionnelle au taux de déformation D.' },
      { title: 'Viscosité ν', content: 'ν = μ/ρ. Mesure la diffusion de la quantité de mouvement (m²/s).' }
    ],
    lines: [
      { ln: 1, parts: [{ type: 'co', text: '# ── DYNAMIQUE NEWTONIENNE (NAVIER-STOKES) ───────────────' }] },
      { ln: 2, parts: [{ type: 'kw', text: 'Loi de Newton' }, { type: 'tx', text: ' pour le cisaillement (Hypothèse de linéarité) :' }] },
      { ln: 3, parts: [{ type: 'formula', text: '    τ = 2μD' }], badge: { type: 'b-blue', text: 'Fermeture constitutif' } },
      { ln: 4, parts: [{ type: 'tx', text: '    μ : ' }, { type: 'hl', text: 'Viscosité Dynamique' }, { type: 'tx', text: ' [Pa.s]. Résistance interne à l\'écoulement.' }] },
      { ln: 5, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 6, parts: [{ type: 'co', text: '# Équation de Navier-Stokes (Incompressible) :' }] },
      { ln: 7, parts: [{ type: 'formula', text: '    ρ(∂u/∂t + (u·∇)u) = −∇p + μ∆u + ρg' }], badge: { type: 'b-red', text: '⭐⭐ IMPORTANT' } },
      { ln: 8, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 9, parts: [{ type: 'co', text: '# Solutions Exactes (Géométries Simples) :' }] },
      { ln: 10, parts: [{ type: 'st', text: 'Poiseuille' }, { type: 'tx', text: ' (Conduite) : Profil parabolique.' }] },
      { ln: 11, parts: [{ type: 'formula', text: '    u(r) = (1/4μ)(−dp/dz)(R² − r²)' }] },
      { ln: 12, parts: [{ type: 'tx', text: '    V_max au centre, V_nulle aux parois (R).' }] },
      { ln: 13, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 14, parts: [{ type: 'kw', text: 'Viscosité' }, { type: 'tx', text: ' Cinématique : ν = μ / ρ [m²/s].' }] },
      { ln: 15, parts: [{ type: 'st', text: 'Écoulement de Couette' }, { type: 'tx', text: ' : Entre 2 plaques en translation relative.' }] },
      { ln: 16, parts: [{ type: 'tx', text: '    Profil linéaire de vitesse (gradient constant).' }] },
      { ln: 17, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 18, parts: [{ type: 'kw', text: 'Condition Limite' }, { type: 'tx', text: ' : Adhérence stricte (v_fluide = v_paroi).' }] },
    ],
  },
  {
    id: 'ch5',
    tabLabel: 'Bernoulli',
    summary: 'Théorèmes d\'Euler et de Bernoulli. Conservation de la Charge Hydraulique.',
    insights: [
      { title: '4 Hypothèses', content: 'Bernoulli nécessite : Stationnaire, Irrotationnel, Parfait (τ=0), Incompressible.' },
      { title: 'Charge H', content: 'H = v²/2g + p/ρg + z. Unité : [mètres]. Se conserve le long d\'une ligne de courant.' },
      { title: 'Euler (Forces)', content: 'Permet de calculer la force sur un obstacle sans connaître le détail du champ σ.' },
      { title: 'Effet Venturi', content: 'Dans un rétrécissement, la vitesse augmente et la pression diminue (p_A > p_B).' },
      { title: 'Tube de Pitot', content: 'Mesure la vitesse par la différence entre pression totale (arrêt) et pression statique.' }
    ],
    lines: [
      { ln: 1, parts: [{ type: 'co', text: '# ── THÉORÈMES GÉNÉRAUX ET ÉNERGIE ───────────────────────' }] },
      { ln: 2, parts: [{ type: 'co', text: '# Théorème de Bernoulli (Conservation de la Charge) :' }] },
      { ln: 3, parts: [{ type: 'tx', text: '    Pour un fluide parfait et incompressible :' }] },
      { ln: 4, parts: [{ type: 'formula', text: '    v²/2g + p/ρg + z = Charge (H) = Cte' }], badge: { type: 'b-red', text: '⭐⭐ IMPORTANT' } },
      { ln: 5, parts: [{ type: 'tx', text: '    - v²/2g : Charge dynamique | p/ρg : Charge de pression.' }] },
      { ln: 6, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 7, parts: [{ type: 'co', text: '# Théorème d\'Euler (Quantité de Mouvement) :' }] },
      { ln: 8, parts: [{ type: 'tx', text: '    Calcul des efforts sur un obstacle ou coude :' }] },
      { ln: 9, parts: [{ type: 'formula', text: '    ΣF_ext = Q_m * (v_out − v_in)' }], badge: { type: 'b-blue', text: 'PRATIQUE' } },
      { ln: 10, parts: [{ type: 'tx', text: '    Q_m = ρ * Q_v (Débit massique).' }] },
      { ln: 11, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 12, parts: [{ type: 'co', text: '# Échanges d\'Énergie (Machines) :' }] },
      { ln: 13, parts: [{ type: 'tx', text: '    ΔH = H_out - H_in + Pertes + Travail_Machine.' }] },
      { ln: 14, parts: [{ type: 'st', text: 'Pompe' }, { type: 'tx', text: ' : Fournit de la charge (ΔH > 0).' }] },
      { ln: 15, parts: [{ type: 'st', text: 'Turbine' }, { type: 'tx', text: ' : Récupère de la charge (ΔH < 0).' }] },
      { ln: 16, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 17, parts: [{ type: 'kw', text: 'Note' }, { type: 'tx', text: ' : Les pertes de charge (viscosité) font chuter H.' }] },
    ],
  },
  {
    id: 'ch6',
    tabLabel: 'Similitude',
    summary: 'Analyse dimensionnelle et nombres sans dimension. Théorème Π.',
    insights: [
      { title: 'Théorème Π', content: 'Réduit un problème de n variables à k nombres adimensionnels (k = n - r).' },
      { title: 'Similitude', content: 'Nécessite Re_maquette = Re_réel et Fr_maquette = Fr_réel.' },
      { title: 'Peclet Number', content: 'Pe = Re * Pr. Rapport entre transport convectif et diffusif de chaleur.' },
      { title: 'Moody / Darcy', content: 'Le coefficient de frottement λ dépend de Re et de la rugosité ε/D.' },
      { title: 'Nombre de Mach', content: 'Ma = V/c. Si Ma < 0.3, on peut considérer le fluide comme incompressible.' }
    ],
    lines: [
      { ln: 1, parts: [{ type: 'co', text: '# ── NOMBRES ADIMENSIONNELS ET SIMILITUDE ───────────────' }] },
      { ln: 2, parts: [{ type: 'kw', text: 'Reynolds (Re)' }, { type: 'tx', text: ' = ρVL / μ = Inertie / Viscosité.' }], badge: { type: 'b-red', text: 'LE PLUS IMPORTANT' } },
      { ln: 3, parts: [{ type: 'tx', text: '    - Re < 2000 : Laminaire | Re > 4000 : Turbulent.' }] },
      { ln: 4, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 5, parts: [{ type: 'kw', text: 'Froude (Fr)' }, { type: 'tx', text: ' = V / √(gL) = Inertie / Gravité.' }] },
      { ln: 6, parts: [{ type: 'tx', text: '    Crucial pour les écoulements à surface libre (canaux).' }] },
      { ln: 7, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 8, parts: [{ type: 'co', text: '# Nombres Thermiques (Page 89 PDF) :' }] },
      { ln: 9, parts: [{ type: 'st', text: 'Peclet (Pe)' }, { type: 'tx', text: ' : Convection thermique / Diffusion thermique.' }] },
      { ln: 10, parts: [{ type: 'st', text: 'Eckert (Ec)' }, { type: 'tx', text: ' : Énergie Cinétique / Énergie Interne.' }] },
      { ln: 11, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 12, parts: [{ type: 'co', text: '# Pertes de Charge (Darcy-Weisbach) :' }] },
      { ln: 13, parts: [{ type: 'formula', text: '    ΔH = λ * (L/D) * (v²/2g)' }] },
      { ln: 14, parts: [{ type: 'tx', text: '    λ dépend de Re et de la rugosité relative ε/D.' }] },
      { ln: 15, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 16, parts: [{ type: 'kw', text: 'Diagramme de Moody' }, { type: 'tx', text: ' : Abaque pour trouver λ (frottement).' }] },
    ],
  },
  {
    id: 'ch7',
    tabLabel: 'Potentiel',
    summary: 'Écoulements irrotationnels de fluides parfaits. Méthode du potentiel complexe.',
    insights: [
      { title: 'Superposition', content: 'Comme Δφ = 0 est linéaire, on peut sommer des solutions élémentaires.' },
      { title: 'Paradoxe D\'Alembert', content: 'Pas de traînée pour un corps symétrique en fluide parfait (corrigé par Ch8).' },
      { title: 'Cauchy-Riemann', content: 'Assure que le potentiel complexe f(z) est holomorphe.' },
      { title: 'Point d\'Arrêt', content: 'Point du champ où la vitesse est nulle. La pression y est maximale (pression d\'arrêt).' },
      { title: 'Vitesse Complexe', content: 'w(z) = u - iv. Permet de trouver u et v par simple dérivation de f(z).' }
    ],
    lines: [
      { ln: 1, parts: [{ type: 'co', text: '# ── ÉCOULEMENTS POTENTIELS (IRROTATIONNELS) ────────────' }] },
      { ln: 2, parts: [{ type: 'kw', text: 'Vitesse' }, { type: 'tx', text: ' dérive d\'un potentiel φ : ' }, { type: 'formula', text: 'u = ∇φ' }] },
      { ln: 3, parts: [{ type: 'tx', text: '    L\'incompressibilité → Équation de Laplace : ' }, { type: 'formula', text: 'Δφ = 0' }] },
      { ln: 4, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 5, parts: [{ type: 'co', text: '# Potentiel Complexe f(z) = φ + iψ :' }] },
      { ln: 6, parts: [{ type: 'tx', text: '    w(z) = df/dz = u - iv (Vitesse complexe).' }] },
      { ln: 7, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 8, parts: [{ type: 'co', text: '# Solutions de Base :' }] },
      { ln: 9, parts: [{ type: 'st', text: 'Source/Puits' }, { type: 'tx', text: ' : f(z) = (Q/2π) Log(z).' }] },
      { ln: 10, parts: [{ type: 'st', text: 'Tourbillon' }, { type: 'tx', text: ' : f(z) = -i(Γ/2π) Log(z).' }] },
      { ln: 11, parts: [{ type: 'st', text: 'Doublet' }, { type: 'tx', text: ' : f(z) = k / z.' }] },
      { ln: 12, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 13, parts: [{ type: 'co', text: '# Cylindre (Uniforme + Doublet) :' }] },
      { ln: 14, parts: [{ type: 'formula', text: '    f(z) = U₀ (z + R²/z)' }], badge: { type: 'b-blue', text: 'CLASSIQUE' } },
      { ln: 15, parts: [{ type: 'tx', text: '    Points d\'arrêt en z = ±R (vitesse nulle).' }] },
      { ln: 16, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 17, parts: [{ type: 'kw', text: 'Glissement' }, { type: 'tx', text: ' : V_fluide tangentielle à la paroi (u·n=0).' }] },
    ],
  },
  {
    id: 'ch8',
    tabLabel: 'C.L.',
    summary: 'Théorie de la Couche Limite (Prandtl). Effets visqueux près des parois.',
    insights: [
      { title: 'Épaisseur δ', content: 'δ ~ L / √Re. Très faible pour Re élevé, mais gradient ∂u/∂y énorme.' },
      { title: 'Décollement', content: 'Se produit si gradient de pression défavorable (dp/dx > 0).' },
      { title: 'Blasius', content: 'Solution exacte pour une plaque plane sans gradient de pression.' },
      { title: 'Épaisseur δ1', content: 'Épaisseur de déplacement. Représente le déficit de débit dû au freinage.' },
      { title: 'Épaisseur δ2', content: 'Épaisseur de quantité de mouvement. Liée à la traînée de frottement Cf.' }
    ],
    lines: [
      { ln: 1, parts: [{ type: 'co', text: '# ── THÉORIE DE LA COUCHE LIMITE (PRANDTL) ──────────────' }] },
      { ln: 2, parts: [{ type: 'kw', text: 'Hypothèse' }, { type: 'tx', text: ' : Viscosité importante uniquement près de la paroi.' }] },
      { ln: 3, parts: [{ type: 'tx', text: '    À l\'extérieur, le fluide est considéré comme parfait (Ch7).' }] },
      { ln: 4, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 5, parts: [{ type: 'co', text: '# Équations de Prandtl (2D) :' }] },
      { ln: 6, parts: [{ type: 'formula', text: '    u ∂u/∂x + v ∂u/∂y = −(1/ρ) dp/dx + ν ∂²u/∂y²' }] },
      { ln: 7, parts: [{ type: 'tx', text: '    Condition à la paroi : u = v = 0 (Adhérence).' }] },
      { ln: 8, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 9, parts: [{ type: 'co', text: '# Épaisseurs Caractéristiques :' }] },
      { ln: 10, parts: [{ type: 'st', text: 'δ_0.99' }, { type: 'tx', text: ' : Épaisseur physique (u = 0.99 U_ext).' }] },
      { ln: 11, parts: [{ type: 'st', text: 'δ_1 (Déplacement)' }, { type: 'tx', text: ' : Déficit de débit du au freinage.' }] },
      { ln: 12, parts: [{ type: 'formula', text: '    δ_1 = ∫ (1 - u/U_e) dy' }] },
      { ln: 13, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 14, parts: [{ type: 'co', text: '# Relation Intégrale de Von Karman :' }] },
      { ln: 15, parts: [{ type: 'formula', text: '    τ_w = ρ U_e² dδ₂/dx + ...' }], badge: { type: 'b-amber', text: '⭐ PRATIQUE' } },
      { ln: 16, parts: [{ type: 'tx', text: '    Relie la contrainte à la paroi (frottement) à l\'épaisseur δ₂.' }] },
      { ln: 17, parts: [{ type: 'tx', text: ' ' }] },
      { ln: 18, parts: [{ type: 'kw', text: 'Note' }, { type: 'tx', text: ' : Le décollement stoppe la validité de cette théorie.' }] },
    ],
  },
];