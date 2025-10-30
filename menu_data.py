# menu_data.py
# This list contains all items to be uploaded to your menu_table.

MENU_ITEMS = [
    # --- Parent Bento Box Item ---
    {
        "ItemID": "sku-100",
        "ItemName": "Bento Box",
        "ItemType": "PARENT",
        "BasePrice": 1499,
        "PriceModifier": 0,
        "Location": "both",
        "name_mandarin": "便当",
        "UberEatsID": "bento_box"
    },
    
    # --- Group 1: Required Protein Modifiers ---
    {
        "ItemID": "sku-101",
        "ItemName": "Beef Short Rib (Bento)",
        "ItemType": "MODIFIER",
        "BasePrice": 0,
        "PriceModifier": 100,
        "Location": "both",
        "name_mandarin": "牛仔骨",
        "UberEatsID": "bento-protein-beef-rib"
    },
    {
        "ItemID": "sku-102",
        "ItemName": "Chicken Teriyaki (Bento)",
        "ItemType": "MODIFIER",
        "BasePrice": 0,
        "PriceModifier": 0,
        "Location": "both",
        "name_mandarin": "照烧鸡",
        "UberEatsID": "bento-protein-chicken"
    },
    {
        "ItemID": "sku-103",
        "ItemName": "Salmon Teriyaki (Bento)",
        "ItemType": "MODIFIER",
        "BasePrice": 0,
        "PriceModifier": 0,
        "Location": "both",
        "name_mandarin": "照烧三文鱼",
        "UberEatsID": "bento-protein-salmon"
    },
    {
        "ItemID": "sku-104",
        "ItemName": "Tempura (Bento)",
        "ItemType": "MODIFIER",
        "BasePrice": 0,
        "PriceModifier": 0,
        "Location": "both",
        "name_mandarin": "天妇罗",
        "UberEatsID": "bento-protein-tempura"
    },
    {
        "ItemID": "sku-105",
        "ItemName": "Tofu Tempura (Bento)",
        "ItemType": "MODIFIER",
        "BasePrice": 0,
        "PriceModifier": 0,
        "Location": "both",
        "name_mandarin": "豆腐天妇罗",
        "UberEatsID": "bento-protein-tofu"
    },

    # --- Group 2: Optional Side Add-ons ---
    {
        "ItemID": "sku-110",
        "ItemName": "California Roll (Side)",
        "ItemType": "MODIFIER",
        "BasePrice": 0,
        "PriceModifier": 500,
        "Location": "both",
        "name_mandarin": "加州卷",
        "UberEatsID": "bento-side-cali"
    },
    {
        "ItemID": "sku-111",
        "ItemName": "Spicy Salmon Roll (Side)",
        "ItemType": "MODIFIER",
        "BasePrice": 0,
        "PriceModifier": 500,
        "Location": "both",
        "name_mandarin": "辣三文鱼卷",
        "UberEatsID": "bento-side-sp-salmon"
    },
    {
        "ItemID": "sku-112",
        "ItemName": "Spicy Tuna Roll (Side)",
        "ItemType": "MODIFIER",
        "BasePrice": 0,
        "PriceModifier": 500,
        "Location": "both",
        "name_mandarin": "辣吞拿鱼卷",
        "UberEatsID": "bento-side-sp-tuna"
    },
    {
        "ItemID": "sku-113",
        "ItemName": "Assorted Sashimi (5 pcs) (Side)",
        "ItemType": "MODIFIER",
        "BasePrice": 0,
        "PriceModifier": 500,
        "Location": "both",
        "name_mandarin": "刺身拼盘 (5片)",
        "UberEatsID": "bento-side-sashimi"
    },
    {
        "ItemID": "sku-114",
        "ItemName": "Assorted Sushi (5 pcs) (Side)",
        "ItemType": "MODIFIER",
        "BasePrice": 0,
        "PriceModifier": 500,
        "Location": "both",
        "name_mandarin": "寿司拼盘 (5贯)",
        "UberEatsID": "bento-side-sushi"
    },
    {
        "ItemID": "sku-115",
        "ItemName": "Shrimp (2) & Veg (5) Tempura (Side)",
        "ItemType": "MODIFIER",
        "BasePrice": 0,
        "PriceModifier": 500,
        "Location": "both",
        "name_mandarin": "天妇罗拼盘 (虾2, 菜5)",
        "UberEatsID": "bento-side-shrimp-veg"
    }
]