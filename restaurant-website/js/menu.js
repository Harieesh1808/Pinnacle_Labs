// menu.js - Renders the vegetarian menu into #menu-container
// Structure/fonts match the original Ember & Savor design (Inter + serif headings)

const menuData = {
  restaurantName: "Ember & Savor",
  subtitle: "NO. 0148 · HARBOR ROAD <br><span style='color:#7a8079; display:inline-block; margin-top:8px;'>A PURE VEG FINE DINING RESTAURANT</span>",
  sections: [
    {
      label: "TO START",
      items: [
        {
          name: "Truffle Mushroom Bruschetta",
          desc: "Wild mushrooms, truffle oil, grilled sourdough",
          price: "$17"
        },
        {
          name: "Roasted Beet Carpaccio",
          desc: "Whipped goat cheese, candied walnuts, arugula",
          price: "$18"
        },
        {
          name: "Burrata & Roasted Tomato",
          desc: "Heirloom tomatoes, basil oil, aged balsamic",
          price: "$16"
        },
        {
          name: "Crispy Halloumi",
          desc: "Honey drizzle, chili flakes, mint",
          price: "$18"
        },
        {
          name: "Stuffed Portobello Mushrooms",
          desc: "Herbed ricotta, spinach, toasted pine nuts",
          price: "$19"
        }
      ]
    },
    {
      label: "THE FIRE",
      items: [
        {
          name: "Charred Cauliflower Steak",
          desc: "Romesco, pickled shallots, herb oil",
          price: "$18"
        },
        {
          name: "Grilled King Oyster Mushroom",
          desc: "Chimichurri, roasted garlic jus",
          price: "$32"
        },
        {
          name: "Wild Mushroom Risotto",
          desc: "Parmesan, truffle, crispy sage",
          price: "$29"
        },
        {
          name: "Eggplant Parmigiana",
          desc: "San Marzano tomato, fior di latte, basil",
          price: "$27"
        },
        {
          name: "Herb-Grilled Paneer Steak",
          desc: "Charred over oak, mint chutney, lemon oil",
          price: "$26"
        },
        {
          name: "Smoked Vegetable Lasagna",
          desc: "Layered roasted vegetables, béchamel, smoked cheese",
          price: "$28"
        },
        {
          name: "Spinach & Ricotta Ravioli",
          desc: "Sage brown butter, toasted walnuts",
          price: "$30"
        }
      ]
    },
    {
      label: "TO FINISH",
      items: [
        {
          name: "Olive Oil Cake",
          desc: "Candied orange, crème fraîche",
          price: "$12"
        },
        {
          name: "Basque Cheesecake",
          desc: "Burnt caramel top, sea salt",
          price: "$14"
        },
        {
          name: "Pistachio Tiramisu",
          desc: "Espresso-soaked ladyfingers, pistachio cream",
          price: "$15"
        },
        {
          name: "Dark Chocolate Mousse",
          desc: "Sea salt, cocoa nib crunch",
          price: "$13"
        }
      ]
    }
  ]
};

function renderMenu(data) {
  const container = document.getElementById("menu-container");
  if (!container) return;

  container.innerHTML = "";

  // Header
  const header = document.createElement("div");
  header.className = "menu-header";
  header.innerHTML = `
    <h2>${data.restaurantName}</h2>
    <div class="menu-subtitle">${data.subtitle}</div>
  `;
  container.appendChild(header);

  // Sections
  data.sections.forEach((section) => {
    const sectionEl = document.createElement("div");
    sectionEl.className = "menu-section";

    const labelEl = document.createElement("div");
    labelEl.className = "menu-section-label";
    labelEl.textContent = section.label;
    sectionEl.appendChild(labelEl);

    section.items.forEach((item, idx) => {
      const itemEl = document.createElement("div");
      itemEl.className = "menu-item";
      itemEl.innerHTML = `
        <div class="menu-item-info">
          <p class="menu-item-name">${item.name}</p>
          <p class="menu-item-desc">${item.desc}</p>
        </div>
        <div class="menu-item-price">${item.price}</div>
      `;
      sectionEl.appendChild(itemEl);

      if (idx < section.items.length - 1) {
        const divider = document.createElement("hr");
        divider.className = "menu-divider";
        sectionEl.appendChild(divider);
      }
    });

    container.appendChild(sectionEl);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderMenu(menuData);
});
