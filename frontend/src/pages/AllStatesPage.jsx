import React, { useState, useEffect } from 'react';
import './AllStatesPage.css';

const allStatesData = [
  { 
    name: 'Andhra Pradesh', 
    image: 'https://commons.m.wikimedia.org/wiki/File:Kondapalli_toys_at_a_house_in_Vijayawada.jpg', 
    crafts: [
        { name: 'Kalamkari', description: 'An ancient style of hand-painting cotton textiles with a tamarind pen, using only natural dyes.', image: 'https://placehold.co/600x400/10B981/FFFFFF?text=Kalamkari' },
        { name: 'Kondapalli Toys', description: 'Figurines carved from a special lightweight wood and painted with vibrant colors.', image: 'https://placehold.co/400x300/F97316/FFFFFF?text=Kondapalli' }
    ], 
    microtext: 'Land of Kalamkari Art', 
    badge: '🎨',
    fullDescription: 'Andhra Pradesh is celebrated for its rich tradition of Kalamkari, an intricate art form of hand-painting or block-printing on cotton textiles. The state is also home to Kondapalli toys, unique wooden figurines that often depict mythological characters and scenes from rural life.'
  },
  { 
    name: 'Bihar', 
    image: 'https://placehold.co/600x400/10B981/FFFFFF?text=Bihar', 
    crafts: [
        { name: 'Madhubani Painting', description: 'A vibrant and intricate style of folk painting, traditionally created by the women of the Mithila region.', image: 'https://placehold.co/400x300/10B981/FFFFFF?text=Madhubani' }
    ], 
    microtext: 'Home of Mithila Paintings', 
    badge: '🖌️',
    fullDescription: 'Bihar is world-renowned for Madhubani painting, a traditional art form characterized by its complex geometric patterns and symbolic imagery. This ancient craft, passed down through generations of women, captures the cultural and spiritual essence of the Mithila region.'
  },
  { 
    name: 'Arunachal Pradesh',
    image: 'https://placehold.co/600x400/3B82F6/FFFFFF?text=Arunachal+Pradesh',
    crafts: [
      { name: 'Thangka Painting', description: 'A traditional Tibetan Buddhist painting on cotton or silk appliqué, depicting deities, mandalas, or scenes.', image: 'https://placehold.co/400x300/3B82F6/FFFFFF?text=Thangka' },
      { name: 'Bamboo & Cane Crafts', description: 'Everyday and decorative items skillfully woven from bamboo and cane, reflecting tribal artistry.', image: 'https://placehold.co/400x300/3B82F6/FFFFFF?text=Bamboo+Cane' }
    ],
    microtext: 'Land of the Rising Sun',
    badge: '🌄',
    fullDescription: 'Arunachal Pradesh boasts diverse tribal crafts, especially Thangka paintings and bamboo cane work. These reflect the state’s deep spiritual roots and harmony with nature.'
  },
  { 
    name: 'Assam',
    image: 'https://placehold.co/600x400/2563EB/FFFFFF?text=Assam',
    crafts: [
      { name: 'Assam Silk', description: 'Renowned for Muga, Eri, and Pat silks, woven into exquisite mekhela chadors and sarees.', image: 'https://placehold.co/400x300/2563EB/FFFFFF?text=Assam+Silk' },
      { name: 'Bell Metal Craft', description: 'The town of Sarthebari is famous for utensils, religious items, and artifacts made from bell metal.', image: 'https://placehold.co/400x300/2563EB/FFFFFF?text=Bell+Metal' }
    ],
    microtext: 'Home of Golden Muga Silk',
    badge: '🧵',
    fullDescription: 'Assam is famous for its silks—Muga, Eri, and Pat—as well as bell metal crafts. These art forms embody the region’s cultural richness and unique identity.'
  },
  { 
    name: 'Chhattisgarh',
    image: 'https://placehold.co/600x400/059669/FFFFFF?text=Chhattisgarh',
    crafts: [
      { name: 'Dhokra Art', description: 'Ancient lost-wax technique used to create stunning brass figurines and jewelry.', image: 'https://placehold.co/400x300/059669/FFFFFF?text=Dhokra' },
      { name: 'Terracotta', description: 'Tribal artisans craft decorative terracotta items that reflect nature and daily life.', image: 'https://placehold.co/400x300/059669/FFFFFF?text=Terracotta' }
    ],
    microtext: 'The Tribal Heart of India',
    badge: '🔥',
    fullDescription: 'Chhattisgarh is renowned for its Dhokra art, terracotta, and tribal crafts. These traditional practices represent a living heritage passed down through generations.'
  },
  { 
    name: 'Delhi',
    image: 'https://placehold.co/600x400/7C3AED/FFFFFF?text=Delhi',
    crafts: [
      { name: 'Zardozi Embroidery', description: 'Luxurious hand embroidery using gold and silver threads, beads, and sequins.', image: 'https://placehold.co/400x300/7C3AED/FFFFFF?text=Zardozi' },
      { name: 'Meenakari Jewelry', description: 'Intricate enamel work on jewelry and artifacts, blending Mughal and Rajasthani influences.', image: 'https://placehold.co/400x300/7C3AED/FFFFFF?text=Meenakari' }
    ],
    microtext: 'City of Crafts & Culture',
    badge: '🏛️',
    fullDescription: 'Delhi is a hub of cultural fusion, with crafts like Zardozi embroidery, meenakari, and metal works thriving in its bustling markets.'
  },
  { 
    name: 'Goa',
    image: 'https://placehold.co/600x400/F59E0B/FFFFFF?text=Goa',
    crafts: [
      { name: 'Wood Carving', description: 'Exquisite wooden furniture, idols, and décor inspired by Portuguese and Indian styles.', image: 'https://placehold.co/400x300/F59E0B/FFFFFF?text=Wood+Carving' },
      { name: 'Coconut Shell Craft', description: 'Functional and decorative items crafted from polished coconut shells.', image: 'https://placehold.co/400x300/F59E0B/FFFFFF?text=Coconut+Shell' }
    ],
    microtext: 'Blend of Indian & Portuguese Art',
    badge: '🌴',
    fullDescription: 'Goa’s crafts reflect its Indo-Portuguese heritage, seen in wood carvings, coconut shell art, and unique metal crafts.'
  },
  { 
    name: 'Gujarat',
    image: 'https://placehold.co/600x400/F43F5E/FFFFFF?text=Gujarat',
    crafts: [
      { name: 'Bandhani Tie-Dye', description: 'Colorful tie-dye textiles featuring intricate dots and patterns.', image: 'https://placehold.co/400x300/F43F5E/FFFFFF?text=Bandhani' },
      { name: 'Patola Sarees', description: 'Double ikat silk sarees from Patan, globally renowned for precision and elegance.', image: 'https://placehold.co/400x300/F43F5E/FFFFFF?text=Patola' }
    ],
    microtext: 'Land of Colors & Textiles',
    badge: '🎭',
    fullDescription: 'Gujarat is a textile paradise, famous for Bandhani, Patola, embroidery, and mirror work. The vibrant crafts embody its cultural spirit.'
  },
  { 
    name: 'Haryana',
    image: 'https://placehold.co/600x400/06B6D4/FFFFFF?text=Haryana',
    crafts: [
      { name: 'Phulkari Embroidery', description: 'Floral embroidery using colorful silk threads on shawls, dupattas, and textiles.', image: 'https://placehold.co/400x300/06B6D4/FFFFFF?text=Phulkari' },
      { name: 'Clay Pottery', description: 'Traditional earthenware pots and decorative pieces crafted by local potters.', image: 'https://placehold.co/400x300/06B6D4/FFFFFF?text=Pottery' }
    ],
    microtext: 'Thread of Flowers',
    badge: '🌸',
    fullDescription: 'Haryana is celebrated for Phulkari embroidery and pottery. These crafts symbolize the vibrancy of rural life and cultural traditions.'
  },
  { 
    name: 'Himachal Pradesh',
    image: 'https://placehold.co/600x400/22C55E/FFFFFF?text=Himachal+Pradesh',
    crafts: [
      { name: 'Pashmina Shawls', description: 'Luxurious handwoven wool shawls prized for softness and warmth.', image: 'https://placehold.co/400x300/22C55E/FFFFFF?text=Pashmina' },
      { name: 'Chamba Rumal', description: 'Hand-embroidered square cloths with double satin stitch depicting stories and motifs.', image: 'https://placehold.co/400x300/22C55E/FFFFFF?text=Chamba+Rumal' }
    ],
    microtext: 'Crafts of the Hills',
    badge: '🧣',
    fullDescription: 'Himachal Pradesh is renowned for its fine wool textiles and Chamba Rumal embroidery, showcasing the region’s artistic finesse.'
  },
  { 
    name: 'Jharkhand',
    image: 'https://placehold.co/600x400/D97706/FFFFFF?text=Jharkhand',
    crafts: [
      { name: 'Sohrai Painting', description: 'Wall paintings celebrating harvest and tribal rituals with natural colors.', image: 'https://placehold.co/400x300/D97706/FFFFFF?text=Sohrai' },
      { name: 'Dhokra Metal Craft', description: 'Brass figurines and ornaments created by tribal artisans using the lost-wax method.', image: 'https://placehold.co/400x300/D97706/FFFFFF?text=Dhokra' }
    ],
    microtext: 'Tribal Arts Alive',
    badge: '🌿',
    fullDescription: 'Jharkhand is known for Sohrai and Khovar paintings, alongside Dhokra metal craft, all deeply rooted in tribal traditions.'
  },

    { 
    name: 'Karnataka', 
    image: 'https://placehold.co/600x400/16A34A/FFFFFF?text=Karnataka', 
    crafts: [
      { name: 'Mysore Paintings', description: 'Classical South Indian paintings known for rich colors and gesso work.', image: 'https://placehold.co/400x300/16A34A/FFFFFF?text=Mysore+Painting' },
      { name: 'Sandalwood Carving', description: 'Intricately carved artifacts from fragrant sandalwood.', image: 'https://placehold.co/400x300/16A34A/FFFFFF?text=Sandalwood' }
    ], 
    microtext: 'Land of Sandalwood & Silk', 
    badge: '🌸',
    fullDescription: 'Karnataka is famed for its Mysore paintings, sandalwood carving, and silk weaving. These crafts reflect the royal heritage and cultural depth of the state.'
  },
  { 
    name: 'Kerala', 
    image: 'https://placehold.co/600x400/0EA5E9/FFFFFF?text=Kerala', 
    crafts: [
      { name: 'Kathakali Masks', description: 'Handcrafted masks representing characters from the Kathakali dance.', image: 'https://placehold.co/400x300/0EA5E9/FFFFFF?text=Kathakali' },
      { name: 'Coir Products', description: 'Eco-friendly mats, ropes, and artifacts made from coconut fiber.', image: 'https://placehold.co/400x300/0EA5E9/FFFFFF?text=Coir' }
    ],
    microtext: 'God’s Own Crafts', 
    badge: '🌴',
    fullDescription: 'Kerala’s crafts are deeply tied to its culture. From Kathakali masks to coir products, artisans transform natural resources into unique works of art.'
  },
  { 
    name: 'Madhya Pradesh', 
    image: 'https://placehold.co/600x400/7C3AED/FFFFFF?text=Madhya+Pradesh', 
    crafts: [
      { name: 'Gond Painting', description: 'A tribal art form depicting nature and mythology in vibrant colors.', image: 'https://placehold.co/400x300/7C3AED/FFFFFF?text=Gond' },
      { name: 'Maheshwari Sarees', description: 'Handwoven sarees with reversible borders and motifs inspired by local architecture.', image: 'https://placehold.co/400x300/7C3AED/FFFFFF?text=Maheshwari' }
    ],
    microtext: 'Heart of Incredible India', 
    badge: '🖼️',
    fullDescription: 'Madhya Pradesh is home to tribal crafts like Gond painting and Maheshwari weaving. The state’s artisans combine tradition with storytelling through their art.'
  },
  { 
    name: 'Maharashtra', 
    image: 'https://placehold.co/600x400/E11D48/FFFFFF?text=Maharashtra', 
    crafts: [
      { name: 'Warli Painting', description: 'Simplistic tribal art using white patterns on mud walls.', image: 'https://placehold.co/400x300/E11D48/FFFFFF?text=Warli' },
      { name: 'Paithani Sarees', description: 'Luxurious silk sarees with intricate zari borders.', image: 'https://placehold.co/400x300/E11D48/FFFFFF?text=Paithani' }
    ],
    microtext: 'Land of Warli Art', 
    badge: '🎨',
    fullDescription: 'Maharashtra’s folk art traditions include the world-famous Warli paintings and Paithani silk weaving, both treasured for their cultural symbolism.'
  },
  { 
    name: 'Manipur', 
    image: 'https://placehold.co/600x400/F97316/FFFFFF?text=Manipur', 
    crafts: [
      { name: 'Shaphee Lanphee', description: 'Embroidered shawls with geometric motifs, often gifted as symbols of honor.', image: 'https://placehold.co/400x300/F97316/FFFFFF?text=Lanphee' },
      { name: 'Kauna Craft', description: 'Baskets and mats woven from water reeds.', image: 'https://placehold.co/400x300/F97316/FFFFFF?text=Kauna' }
    ], 
    microtext: 'Jewel of India', 
    badge: '💎',
    fullDescription: 'Manipur’s handicrafts, like Kauna reed products and embroidered shawls, reflect the state’s artistry and spiritual culture.'
  },
  { 
    name: 'Meghalaya', 
    image: 'https://placehold.co/600x400/2563EB/FFFFFF?text=Meghalaya', 
    crafts: [
      { name: 'Cane & Bamboo Craft', description: 'Baskets, mats, and furniture woven with bamboo and cane.', image: 'https://placehold.co/400x300/2563EB/FFFFFF?text=Cane' }
    ],
    microtext: 'Abode of Clouds', 
    badge: '☁️',
    fullDescription: 'Meghalaya’s artisans use bamboo and cane to create everyday essentials and decorative items, reflecting sustainable and eco-friendly living.'
  },
  { 
    name: 'Mizoram', 
    image: 'https://placehold.co/600x400/059669/FFFFFF?text=Mizoram', 
    crafts: [
      { name: 'Mizo Puan Weaving', description: 'Handwoven traditional shawls with bold patterns.', image: 'https://placehold.co/400x300/059669/FFFFFF?text=Puan' }
    ],
    microtext: 'Land of the Highlanders', 
    badge: '🏔️',
    fullDescription: 'Mizoram’s weaving traditions, especially the Mizo puan shawls, are integral to its identity and worn during festivals and ceremonies.'
  },
  { 
    name: 'Nagaland', 
    image: 'https://placehold.co/600x400/DC2626/FFFFFF?text=Nagaland', 
    crafts: [
      { name: 'Naga Shawls', description: 'Handwoven shawls with symbolic motifs, each pattern representing tribal identity.', image: 'https://placehold.co/400x300/DC2626/FFFFFF?text=Naga+Shawl' },
      { name: 'Wood Carving', description: 'Intricately carved wood used in tribal houses and ceremonial objects.', image: 'https://placehold.co/400x300/DC2626/FFFFFF?text=Wood+Carving' }
    ],
    microtext: 'Land of Festivals', 
    badge: '🥁',
    fullDescription: 'Nagaland’s crafts are tied to its tribal culture, with distinctive shawls and wooden carvings forming part of everyday life and rituals.'
  },
  { 
    name: 'Odisha', 
    image: 'https://placehold.co/600x400/FACC15/FFFFFF?text=Odisha', 
    crafts: [
      { name: 'Pattachitra', description: 'Traditional cloth scroll paintings depicting mythological stories.', image: 'https://placehold.co/400x300/FACC15/FFFFFF?text=Pattachitra' },
      { name: 'Silver Filigree', description: 'Intricate jewelry and artifacts made of fine silver wires.', image: 'https://placehold.co/400x300/FACC15/FFFFFF?text=Filigree' }
    ],
    microtext: 'Land of Artistic Heritage', 
    badge: '✨',
    fullDescription: 'Odisha is celebrated for its Pattachitra paintings, appliqué work, and silver filigree, reflecting a rich temple and cultural heritage.'
  },
  { 
    name: 'Punjab', 
    image: 'https://placehold.co/600x400/65A30D/FFFFFF?text=Punjab', 
    crafts: [
      { name: 'Phulkari', description: 'Colorful embroidery with floral motifs, often on shawls and dupattas.', image: 'https://placehold.co/400x300/65A30D/FFFFFF?text=Phulkari' },
      { name: 'Juttis', description: 'Handcrafted leather footwear decorated with embroidery and beads.', image: 'https://placehold.co/400x300/65A30D/FFFFFF?text=Jutti' }
    ],
    microtext: 'Spirit of Vibrance', 
    badge: '🌸',
    fullDescription: 'Punjab is synonymous with Phulkari embroidery and juttis, both celebrated for their vibrancy and connection to Punjabi festivals and traditions.'
  },
  { 
    name: 'Rajasthan', 
    image: 'https://placehold.co/600x400/9333EA/FFFFFF?text=Rajasthan', 
    crafts: [
      { name: 'Blue Pottery', description: 'Distinctive pottery glazed in striking blue patterns.', image: 'https://placehold.co/400x300/9333EA/FFFFFF?text=Pottery' },
      { name: 'Block Printing', description: 'Textiles hand-printed with carved wooden blocks.', image: 'https://placehold.co/400x300/9333EA/FFFFFF?text=Block+Print' }
    ],
    microtext: 'Land of Royal Heritage', 
    badge: '👑',
    fullDescription: 'Rajasthan’s crafts include blue pottery, block printing, and miniature paintings, reflecting its royal legacy and desert culture.'
  },
  { 
    name: 'Sikkim', 
    image: 'https://placehold.co/600x400/EA580C/FFFFFF?text=Sikkim', 
    crafts: [
      { name: 'Thangka Painting', description: 'Buddhist scroll paintings rich with symbolic imagery.', image: 'https://placehold.co/400x300/EA580C/FFFFFF?text=Thangka' },
      { name: 'Carpet Weaving', description: 'Hand-knotted carpets with Buddhist motifs.', image: 'https://placehold.co/400x300/EA580C/FFFFFF?text=Carpet' }
    ],
    microtext: 'Valley of Rice', 
    badge: '🌾',
    fullDescription: 'Sikkim’s handicrafts draw from its Buddhist heritage, with thangka painting and carpet weaving being central to its cultural identity.'
  },
  { 
    name: 'Tamil Nadu', 
    image: 'https://placehold.co/600x400/16A34A/FFFFFF?text=Tamil+Nadu', 
    crafts: [
      { name: 'Tanjore Painting', description: 'Religious paintings with gold foil and vivid colors.', image: 'https://placehold.co/400x300/16A34A/FFFFFF?text=Tanjore' },
      { name: 'Kanchipuram Silk', description: 'Exquisite silk sarees with contrasting borders and temple designs.', image: 'https://placehold.co/400x300/16A34A/FFFFFF?text=Kanchipuram' }
    ],
    microtext: 'Cradle of Dravidian Culture', 
    badge: '🪔',
    fullDescription: 'Tamil Nadu is world-famous for Kanchipuram silks and Tanjore paintings, deeply tied to temple traditions and South Indian heritage.'
  },
  { 
    name: 'Telangana', 
    image: 'https://placehold.co/600x400/0EA5E9/FFFFFF?text=Telangana', 
    crafts: [
      { name: 'Bidriware', description: 'Black metal inlay work with silver designs.', image: 'https://placehold.co/400x300/0EA5E9/FFFFFF?text=Bidriware' },
      { name: 'Nirmal Paintings', description: 'Paintings on wood with gold highlights, depicting epics and folklore.', image: 'https://placehold.co/400x300/0EA5E9/FFFFFF?text=Nirmal' }
    ],
    microtext: 'Land of Charminar', 
    badge: '🏯',
    fullDescription: 'Telangana is home to Bidri metalwork and Nirmal paintings, crafts admired for their elegance and historical roots.'
  },
  { 
    name: 'Tripura', 
    image: 'https://placehold.co/600x400/7C3AED/FFFFFF?text=Tripura', 
    crafts: [
      { name: 'Handloom Weaving', description: 'Traditional garments woven on bamboo looms.', image: 'https://placehold.co/400x300/7C3AED/FFFFFF?text=Weaving' },
      { name: 'Bamboo Craft', description: 'Household items and decorative pieces made from bamboo.', image: 'https://placehold.co/400x300/7C3AED/FFFFFF?text=Bamboo' }
    ],
    microtext: 'Queen of the Hills', 
    badge: '👑',
    fullDescription: 'Tripura’s craft heritage includes fine handloom textiles and bamboo works, blending functionality with artistry.'
  },
  { 
    name: 'Uttar Pradesh', 
    image: 'https://placehold.co/600x400/E11D48/FFFFFF?text=Uttar+Pradesh', 
    crafts: [
      { name: 'Chikankari', description: 'Delicate hand embroidery from Lucknow.', image: 'https://placehold.co/400x300/E11D48/FFFFFF?text=Chikankari' },
      { name: 'Banarasi Sarees', description: 'Silk sarees with gold and silver brocade designs.', image: 'https://placehold.co/400x300/E11D48/FFFFFF?text=Banarasi' }
    ],
    microtext: 'Heartland of Heritage', 
    badge: '🏰',
    fullDescription: 'Uttar Pradesh is famed for Chikankari embroidery and Banarasi silks, representing the zenith of Mughal and Indian textile craftsmanship.'
  },
  { 
    name: 'Uttarakhand', 
    image: 'https://placehold.co/600x400/F97316/FFFFFF?text=Uttarakhand', 
    crafts: [
      { name: 'Aipan Art', description: 'Ritualistic floor and wall paintings made with red clay and rice paste.', image: 'https://placehold.co/400x300/F97316/FFFFFF?text=Aipan' },
      { name: 'Ringaal Craft', description: 'Products crafted from a special type of bamboo.', image: 'https://placehold.co/400x300/F97316/FFFFFF?text=Ringaal' }
    ],
    microtext: 'Land of Gods', 
    badge: '⛰️',
    fullDescription: 'Uttarakhand’s crafts like Aipan art and bamboo work reflect its spiritual heritage and natural mountain life.'
  },
  { 
    name: 'West Bengal', 
    image: 'https://placehold.co/600x400/2563EB/FFFFFF?text=West+Bengal', 
    crafts: [
      { name: 'Kantha Embroidery', description: 'Running stitch embroidery used on sarees, quilts, and stoles.', image: 'https://placehold.co/400x300/2563EB/FFFFFF?text=Kantha' },
      { name: 'Terracotta', description: 'Sculptures and temple art made from baked clay.', image: 'https://placehold.co/400x300/2563EB/FFFFFF?text=Terracotta' }
    ],
    microtext: 'Cultural Capital of India', 
    badge: '📚',
    fullDescription: 'West Bengal is known for Kantha embroidery, terracotta temples, and artistic traditions that have shaped India’s cultural renaissance.'
  },

  { 
    name: 'Andaman and Nicobar Islands', 
    image: 'https://placehold.co/600x400/059669/FFFFFF?text=Andaman+%26+Nicobar', 
    crafts: [
      { name: 'Shell Craft', description: 'Artworks and jewelry crafted from seashells.', image: 'https://placehold.co/400x300/059669/FFFFFF?text=Shell' },
      { name: 'Wood Carving', description: 'Intricate wooden handicrafts reflecting island life.', image: 'https://placehold.co/400x300/059669/FFFFFF?text=Wood' }
    ],
    microtext: 'Emerald Islands', 
    badge: '🐚',
    fullDescription: 'The Andaman and Nicobar Islands are known for crafts made of natural materials like shells, coconut, and wood, reflecting their coastal culture.'
  },
  { 
    name: 'Chandigarh', 
    image: 'https://placehold.co/600x400/DC2626/FFFFFF?text=Chandigarh', 
    crafts: [
      { name: 'Phulkari', description: 'Traditional embroidery shared with Punjab and Haryana.', image: 'https://placehold.co/400x300/DC2626/FFFFFF?text=Phulkari' }
    ],
    microtext: 'The City Beautiful', 
    badge: '🌆',
    fullDescription: 'Chandigarh’s handicrafts borrow from neighboring Punjab and Haryana, with Phulkari embroidery and woodwork being popular.'
  },
  { 
    name: 'Dadra and Nagar Haveli and Daman and Diu', 
    image: 'https://placehold.co/600x400/FACC15/FFFFFF?text=Dadra+%26+Diu', 
    crafts: [
      { name: 'Warli Painting', description: 'Tribal paintings depicting daily life and rituals.', image: 'https://placehold.co/400x300/FACC15/FFFFFF?text=Warli' },
      { name: 'Bamboo Craft', description: 'Handmade products from bamboo and cane.', image: 'https://placehold.co/400x300/FACC15/FFFFFF?text=Bamboo' }
    ],
    microtext: 'Fusion of Cultures', 
    badge: '🌊',
    fullDescription: 'The union territory reflects both tribal and coastal cultures, with Warli art and bamboo crafts at its core.'
  },
    

];

const StateCard = ({ state, onNavigate }) => (
  <div 
    className="state-card"
    style={{ backgroundImage: `url(${state.image})` }}
    onClick={() => onNavigate(`state/${state.name.toLowerCase().replace(/\s+/g, '-')}`)}
  >
    <div className="craft-badge">{state.badge}</div>
    <div className="state-info">
      <h3 className="state-name">{state.name}</h3>
      <p className="state-microtext">{state.microtext}</p>
      <div className="craft-tags">
        {state.crafts.map(craft => (
          <span key={craft.name} className="craft-tag">{craft.name}</span>
        ))}
      </div>
    </div>
  </div>
);

const AllStatesPage = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStates, setFilteredStates] = useState(allStatesData);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = allStatesData.filter(state => {
      return (
        state.name.toLowerCase().includes(lowercasedFilter) ||
        state.crafts.some(craft => craft.name.toLowerCase().includes(lowercasedFilter))
      );
    });
    setFilteredStates(filtered);
  }, [searchTerm]);
  
  const findStateData = (stateSlug) => {
    return allStatesData.find(state => state.name.toLowerCase().replace(/\s+/g, '-') === stateSlug);
  };

  return (
    <div className="all-states-page">
      <div className="page-header">
        <h1>Explore by State</h1>
        <p>Discover the rich tapestry of Indian craftsmanship, one state at a time.</p>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by state or craft (e.g., 'Pottery')"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="states-grid">
        {filteredStates.map(state => (
          <StateCard key={state.name} state={state} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
};

export const findStateData = (stateSlug) => {
    return allStatesData.find(state => state.name.toLowerCase().replace(/\s+/g, '-') === stateSlug);
};

export default AllStatesPage;
