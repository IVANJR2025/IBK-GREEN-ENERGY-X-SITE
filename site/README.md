# IBK Green Energy X — Website

Site institucional trilingue (PT · ES · EN) com simuladores de engenharia.  
Tecnologia: HTML + CSS + JavaScript puro (sem frameworks, sem dependências NPM).

---

## Estrutura de pastas

```
site/
├── index.html          ← Página inicial (painéis empilhados)
├── servicos.html       ← Os 4 serviços com painéis alternados
├── simulador.html      ← Simulador PV / Bateria / Carregador VE
├── sobre.html          ← História da empresa e fundador
├── blog.html           ← 3 artigos iniciais
├── contactos.html      ← Formulário + info de contacto
├── css/
│   └── style.css       ← Sistema de design completo
├── js/
│   ├── i18n.js         ← Dicionário PT/ES/EN + função applyLang()
│   ├── main.js         ← Scroll, menu móvel, reveal, fallback imagens
│   └── simulador.js    ← Motores de cálculo (PV, bateria, EV)
└── assets/
    └── img/            ← ← ← COLOQUE AQUI AS SUAS IMAGENS
```

---

## ① Colocar as imagens (passo obrigatório)

Copie os seus ficheiros de imagem para `assets/img/` com exatamente estes nomes:

| Ficheiro         | Usado em                          |
|------------------|-----------------------------------|
| `Logo.png`       | Logotipo — nav, footer, favicon   |
| `FOTO1.jpg`      | Hero da página inicial            |
| `FOTO2.jpg`      | Card de serviço — Solar           |
| `FOTO3.jpg`      | Card de serviço — Baterias        |
| `FOTO4.jpg`      | Card de serviço — Carregadores VE |
| `FOTO5.jpg`      | Card de serviço — Instalações     |
| `FOTO6.jpg`      | Página Sobre — imagem da empresa  |
| `FOTO7.jpg`      | Página Sobre — foto do fundador   |
| `FOTO8.jpg`      | Blog — capa do artigo 1           |
| `FOTO9.jpg`      | Blog — capa do artigo 2           |
| `FOTO10.jpg`     | Blog — capa do artigo 3           |

> **Extensões aceites:** `.jpg`, `.png`, `.jpeg`, `.webp` (o site testa automaticamente por ordem).  
> Se já tiver os ficheiros com outro formato (ex.: `.JPG`), renomeie para minúsculas.

---

## ② Personalizar antes de publicar

Abra cada ficheiro e substitua os placeholders:

| O que substituir                 | Onde está                              |
|----------------------------------|----------------------------------------|
| `+351 000 000 000`               | `contactos.html`                       |
| `geral@ibkgreenenergyx.com`      | todos os ficheiros HTML + `i18n.js`    |
| `parceiros@ibkgreenenergyx.com`  | `contactos.html`                       |
| Morada real da sede              | `contactos.html` + dicionário i18n     |

Para alterar textos em todos os idiomas, edite o ficheiro `js/i18n.js` — cada chave tem uma entrada em `pt`, `es` e `en`.

---

## ③ Inicializar o repositório Git no Cursor

No terminal do Cursor (dentro da pasta `site/`):

```bash
git init
git add .
git commit -m "feat: lançamento inicial do site IBK Green Energy X"
```

---

## ④ Criar repositório no GitHub e fazer push

1. Aceda a [github.com/new](https://github.com/new)  
2. Dê o nome `ibk-green-energy-x` (ou outro à sua escolha)  
3. Deixe **privado** se preferir — pode publicar depois  
4. **Não** inicialize com README (já temos um)

Depois, no terminal:

```bash
git remote add origin https://github.com/SEU-USER/ibk-green-energy-x.git
git branch -M main
git push -u origin main
```

Substitua `SEU-USER` pelo seu utilizador do GitHub.

---

## ⑤ Publicar com GitHub Pages (deploy gratuito)

1. No GitHub, vá a **Settings → Pages**  
2. Em **Branch**, selecione `main` e pasta `/ (root)`  
3. Clique **Save**

O site ficará disponível em:  
`https://SEU-USER.github.io/ibk-green-energy-x/`

A cada `git push` o site atualiza automaticamente em ~30 segundos.

---

## ⑥ Domínio próprio (opcional)

Se tiver um domínio (ex.: `ibkgreenenergyx.com`), crie um ficheiro `CNAME` na raiz:

```
ibkgreenenergyx.com
```

E nas configurações de DNS do seu domínio adicione:
- Tipo `A`, apontando para `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- Ou tipo `CNAME` `www` → `SEU-USER.github.io`

---

## Idiomas

O idioma é guardado no `localStorage` do browser. O visitante escolhe no seletor PT / ES / EN  
no canto superior direito — a preferência mantém-se entre visitas.

Para adicionar uma nova chave de tradução:
1. Adicione a chave ao objeto `pt`, `es` e `en` em `js/i18n.js`
2. Use `data-i18n="a.chave"` no elemento HTML

---

## Motores de cálculo

Os pressupostos técnicos de cada simulador estão documentados em comentários no topo de `js/simulador.js`:

- **PV:** 32 regiões ibéricas com HSP real (PVGIS), módulos 550 W, PR 0,80, tarifa 0,22 €/kWh
- **Bateria:** DoD 0,90, eficiência 0,95, banco de baterias 5–30 kWh, +20 % para backup
- **EV:** potências 3,7–22 kW, limitação pela potência contratada menos 1,5 kW de headroom

Para ajustar os valores, edite as constantes no topo do ficheiro.

---

*IBK Green Energy X © 2026 — Portugal · España*
