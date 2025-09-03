import React, { useState, useEffect } from 'react';
import './AllStatesPage.css';

const allStatesData = [
  { 
    name: 'Andhra Pradesh', 
    image: 'https://th.bing.com/th/id/R.6e7862f748a857bba09de03ec27c3e55?rik=uNe1EjmPy4N%2fRw&riu=http%3a%2f%2fwww.tusktravel.com%2fblog%2fwp-content%2fuploads%2f2019%2f10%2fAnnavaram-Temple-Andhra-Pradesh.jpg&ehk=3XCp9pbSszt103D4VAD0f%2fgQKkOCaLaWj3loKhD%2fk5w%3d&risl=&pid=ImgRaw&r=0', 
    crafts: [
        { name: 'Kalamkari', description: 'Hand-painting on cotton textiles with a tamarind pen, using natural dyes.', image: 'https://tse1.explicit.bing.net/th/id/OIP.JPeA5mLgnJa85r_8-KXGmwHaFj?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' },
        { name: 'Kondapalli Toys', description: 'Figurines carved from lightweight wood and painted vibrantly.', image: 'https://tse2.mm.bing.net/th/id/OIP.o1y0IdPMBSihm37BN4lT7gHaEo?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' }
    ], 
    microtext: 'Land of Kalamkari Art', 
    badge: '🎨',
    fullDescription: 'Celebrated for its rich tradition of Kalamkari textiles and unique Kondapalli wooden toys.'
  },
  { 
    name: 'Arunachal Pradesh',
    image: 'https://tse3.mm.bing.net/th/id/OIP.EocQrk0juN70OBvoF5tBDgHaEK?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3',
    crafts: [
      { name: 'Thangka Painting', description: 'Tibetan Buddhist paintings on cotton or silk appliqué.', image: 'https://th.bing.com/th/id/R.3894e6768a6e35743943cd1e1e169421?rik=ITmxf9hdyTZbCQ&riu=http%3a%2f%2ftraditionalartofnepal.com%2fwp-content%2fuploads%2f2015%2f01%2fBuddha-Thangka-Painting-888x1024.jpg&ehk=iHy3LBbjukABSvXRFDDQOQ50HRCQSmBaChzjTnkCOEw%3d&risl=&pid=ImgRaw&r=0' },
      { name: 'Bamboo Crafts', description: 'Skillfully woven items reflecting tribal artistry.', image: 'https://th.bing.com/th/id/R.85c5d5b864a2ed2e4ef7b8ee5b4c737e?rik=y4iwqct4GOtEYg&riu=http%3a%2f%2fcdn.shopify.com%2fs%2ffiles%2f1%2f0354%2f9161%2f0668%2farticles%2fBamboo-Featured-Napi_1200x1200.jpg%3fv%3d1593064275&ehk=RcSgftRcq1MOZs%2blM6bp3CCBuNyz9VjJka5o%2b%2bK%2fF%2bk%3d&risl=&pid=ImgRaw&r=0' }
    ],
    microtext: 'Land of the Rising Sun',
    badge: '🌄',
    fullDescription: 'Boasts diverse tribal crafts, especially Thangka paintings and bamboo work, reflecting deep spiritual roots.'
  },
  { 
    name: 'Assam',
    image: 'https://images.travelandleisureasia.com/wp-content/uploads/sites/2/2024/01/29132107/Kaziranga-National-Park-Golaghat-Mousam-Ray-Shutterstock.jpg',
    crafts: [
      { name: 'Muga Silk', description: 'Renowned for its golden luster, woven into exquisite mekhela chadors.', image: 'https://www.iiad.edu.in/wp-content/uploads/2022/05/image3-12.webp' },
      { name: 'Bell Metal Craft', description: 'Utensils and artifacts made from bell metal in Sarthebari.', image: 'https://www.revv.co.in/blogs/wp-content/uploads/2022/04/Chattisgarh.jpg' }
    ],
    microtext: 'Home of Golden Muga Silk',
    badge: '🧵',
    fullDescription: 'Famous for its unique Muga, Eri, and Pat silks, alongside traditional bell metal crafts.'
  },
  { 
    name: 'Bihar', 
    image: 'https://www.themysteriousindia.net/wp-content/uploads/2014/09/Nalanda-University.jpg', 
    crafts: [
        { name: 'Madhubani Painting', description: 'Vibrant folk painting created by women of the Mithila region.', image: 'https://tse2.mm.bing.net/th/id/OIP.WO1w1gdJ1hnyl22Mw_s02gHaE4?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' },
        { name: 'Sujni Embroidery', description: 'Traditional textile art where old clothes are stitched with intricate designs.', image: 'https://th.bing.com/th/id/R.1a5585814bcdb05b10352c9043ac71ff?rik=owm0yo%2f%2fBSVBNQ&riu=http%3a%2f%2fwww.folkartopedia.com%2fwp-content%2fuploads%2f2020%2f03%2fSujani-Bihar.jpg&ehk=TnELeqglXmK9i4gZXkI5d7ZKwXXq8fwVLzx0nASMvl8%3d&risl=&pid=ImgRaw&r=0' }
    ], 
    microtext: 'Home of Mithila Paintings', 
    badge: '🖌️',
    fullDescription: 'World-renowned for Madhubani paintings, characterized by complex geometric patterns and symbolic imagery.'
  },
  { 
    name: 'Chhattisgarh',
    image: 'https://www.joonsquare.com/usermanage/image/state/7-chhattisgarh/chhattisgarh-chhattisgarh-05.jpg',
    crafts: [
      { name: 'Dhokra Art', description: 'Ancient lost-wax casting technique used to create stunning brass figurines.', image: 'https://cdn.shopify.com/s/files/1/0483/2598/4420/products/SPPX0245_35a1017e-6205-4472-a0ff-553fff55096c_720x.jpg?v=1671283801' },
      { name: 'Terracotta', description: 'Tribal artisans craft decorative terracotta items reflecting nature and daily life.', image: 'https://magikindia.com/wp-content/uploads/2017/12/terracotta-bastar-1.jpg' }
    ],
    microtext: 'The Tribal Heart of India',
    badge: '🔥',
    fullDescription: 'Renowned for its Dhokra art, terracotta, and tribal crafts representing a living heritage.'
  },
  { 
    name: 'Goa',
    image: 'https://dialtrip.com/wp-content/uploads/2022/04/A-Beautiful-Beach-in-Goa-1024x683-1.jpg',
    crafts: [
      { name: 'Azulejos Tiles', description: 'Hand-painted tin-glazed ceramic tiles, a Portuguese influence.', image: 'https://www.golokaso.com/wp-content/uploads/2017/03/The-Portuguese-Azulejo-tile.jpg' },
      { name: 'Coconut Shell Craft', description: 'Functional and decorative items crafted from polished coconut shells.', image: 'https://tse1.explicit.bing.net/th/id/OIP.LipS4mUgkdXj2MU30Hc_8AHaFb?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' }
    ],
    microtext: 'Blend of Indian & Portuguese Art',
    badge: '🌴',
    fullDescription: 'Goa’s crafts reflect its Indo-Portuguese heritage, seen in Azulejos tiles and coconut shell art.'
  },
  { 
    name: 'Gujarat',
    image: 'https://garvigujarati.com/wp-content/uploads/2019/11/Somnath-Temple.jpg',
    crafts: [
      { name: 'Bandhani Tie-Dye', description: 'Colorful tie-dye textiles featuring intricate dots and patterns.', image: 'https://www.garhatours.in/wp-content/uploads/2016/01/tie-and-dye-bandhani-work-gujarat.jpg' },
      { name: 'Lippan Art', description: 'Traditional mud and mirror work mural craft from Kutch.', image: 'https://i.pinimg.com/originals/ac/42/7a/ac427ab9ed22dc2beae5371a69ba6127.jpg' }
    ],
    microtext: 'Land of Colors & Textiles',
    badge: '🎭',
    fullDescription: 'A textile paradise, famous for Bandhani, Patola, Lippan art, embroidery, and mirror work.'
  },
  { 
    name: 'Haryana',
    image: 'https://www.godigit.com/content/dam/godigit/directportal/en/contenthm/kurukshetra-haryana.jpg',
    crafts: [
      { name: 'Phulkari Embroidery', description: 'Floral embroidery using colorful silk threads on shawls and textiles.', image: 'https://cdn.exoticindia.com/images/products/original/books-2016/naf749f.jpg' },
      { name: 'Terracotta', description: 'Traditional earthenware pots and decorative pieces crafted by local potters.', image: 'https://travelsetu.com/apps/uploads/new_destinations_photos/destination/2023/12/26/d2a3cb04c21654c2e8b713206d648282_1000x1000.jpg' }
    ],
    microtext: 'Thread of Flowers',
    badge: '🌸',
    fullDescription: 'Celebrated for Phulkari embroidery and pottery, symbolizing the vibrancy of rural life.'
  },
  { 
    name: 'Himachal Pradesh',
    image: 'https://static.toiimg.com/photo/msid-93246451,width-96,height-65.cms',
    crafts: [
      { name: 'Pashmina Shawls', description: 'Luxurious handwoven wool shawls prized for softness and warmth.', image: 'https://tse3.mm.bing.net/th/id/OIP.YG1GYxc15s5F-4GEfzDLrwHaE8?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' },
      { name: 'Chamba Rumal', description: 'Hand-embroidered cloths with double satin stitch depicting stories.', image: 'https://tse4.mm.bing.net/th/id/OIP.Og9ZSfD6wRnzbULbXDButQHaHP?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' }
    ],
    microtext: 'Crafts of the Hills',
    badge: '🧣',
    fullDescription: 'Renowned for its fine wool textiles like Kullu and Pashmina shawls, and Chamba Rumal embroidery.'
  },
  { 
    name: 'Jharkhand',
    image: 'https://wallpaperaccess.com/full/9513021.jpg',
    crafts: [
      { name: 'Sohrai Painting', description: 'Wall paintings celebrating harvest and tribal rituals with natural colors.', image: 'https://c8.alamy.com/comp/2PNJA43/sohrai-painting-is-a-mural-art-traditionally-practiced-by-women-in-the-hazaribagh-district-of-jharkhand-in-india-traditionally-used-to-decorate-the-h-2PNJA43.jpg' },
      { name: 'Dhokra Metal Craft', description: 'Brass figurines created by tribal artisans using the lost-wax method.', image: 'https://tse4.mm.bing.net/th/id/OIP.8hcYBMownLNuPwMkQ2cqRQHaEJ?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' }
    ],
    microtext: 'Tribal Arts Alive',
    badge: '🌿',
    fullDescription: 'Known for Sohrai and Khovar paintings, alongside Dhokra metal craft, deeply rooted in tribal traditions.'
  },
  { 
    name: 'Karnataka', 
    image: 'https://w0.peakpx.com/wallpaper/116/957/HD-wallpaper-pushkarni-krishna-temple-karnataka-2022-bing.jpg', 
    crafts: [
      { name: 'Mysore Paintings', description: 'Classical South Indian paintings known for rich colors and gesso work.', image: 'https://i.pinimg.com/736x/5f/65/44/5f6544922cbaac3c74823ad8574c6d76.jpg' },
      { name: 'Channapatna Toys', description: 'Colorful wooden toys and dolls polished with vegetable dyes.', image: 'https://tse3.mm.bing.net/th/id/OIP.-0rYg-tTt8N7TDkLMnv0ewHaFj?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' }
    ], 
    microtext: 'Land of Sandalwood & Silk', 
    badge: '🌸',
    fullDescription: 'Famed for its Mysore paintings, sandalwood carving, and Channapatna toys, reflecting royal heritage.'
  },
  { 
    name: 'Kerala', 
    image: 'https://static.toiimg.com/photo/msid-84502827,width-96,height-65.cms', 
    crafts: [
      { name: 'Aranmula Kannadi', description: 'Handmade metal-alloy mirrors, a well-kept secret of a single family.', image: 'https://tripinic.com/wp-content/uploads/2024/09/Aranmula-Kannadi.jpg' },
      { name: 'Coir Products', description: 'Eco-friendly mats and artifacts made from coconut fiber.', image: 'https://tse2.mm.bing.net/th/id/OIP.BOBSOZqiX0-mPICbq7T8CgHaDe?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' }
    ],
    microtext: 'God’s Own Crafts', 
    badge: '🌴',
    fullDescription: 'Kerala’s crafts are tied to its culture. From Aranmula Kannadi to coir products, artisans transform nature into art.'
  },
  { 
    name: 'Madhya Pradesh', 
    image: 'https://static.toiimg.com/thumb/msid-87464029,width-748,height-499,resizemode=4,imgsize-47212/Orchha.jpg', 
    crafts: [
      { name: 'Gond Painting', description: 'A tribal art form depicting nature and mythology in vibrant colors.', image: 'https://arts.mojarto.com/productImages/MA243467/primary/MA243467.jpeg' },
      { name: 'Maheshwari Sarees', description: 'Handwoven sarees with reversible borders and unique motifs.', image: 'https://whatshelikes.in/wp-content/uploads/2024/02/elegance-the-timeless-beauty-of-maheshwari-sarees-1152x768.jpg' }
    ],
    microtext: 'Heart of Incredible India', 
    badge: '🖼️',
    fullDescription: 'Home to tribal crafts like Gond painting and Maheshwari weaving, combining tradition with storytelling.'
  },
  { 
    name: 'Maharashtra', 
    image: 'https://trendpickle.com/wp-content/uploads/2020/08/ezgif.com-webp-to-jpg-1-1.jpg', 
    crafts: [
      { name: 'Warli Painting', description: 'Simplistic tribal art using white patterns on an earthen background.', image: 'https://infinitylearn.com/surge/wp-content/uploads/2024/01/Warli-Painting-on-Wall.jpg' },
      { name: 'Paithani Sarees', description: 'Luxurious silk sarees with intricate zari borders and peacock motifs.', image: 'https://shaadiwish.com/blog/wp-content/uploads/2020/03/kankatala.jpg' }
    ],
    microtext: 'Land of Warli Art', 
    badge: '🎨',
    fullDescription: 'Famous for the world-renowned Warli paintings and luxurious Paithani silk weaving.'
  },
  { 
    name: 'Manipur', 
    image: 'https://www.adequatetravel.com/blog/wp-content/uploads/2021/03/FI-Manipur-HS-989x500.jpg', 
    crafts: [
      { name: 'Kauna Craft', description: 'Baskets, mats, and bags woven from water reeds.', image: 'https://d2vbj8g7upsspg.cloudfront.net/fit-in/580x348/filters:format(webp)/30-stades/media/post_attachments/bfc7ef48-160.jpg' },
      { name: 'Longpi Pottery', description: 'Black stone pottery made without a potter\'s wheel.', image: 'https://jaypore.files.wordpress.com/2022/04/longpi_pottery_of_thankul_naga_tribes_dscn1244_03.jpg?w=768' }
    ], 
    microtext: 'Jewel of India', 
    badge: '💎',
    fullDescription: 'Manipur’s handicrafts, like Kauna reed products and unique Longpi pottery, reflect artistry and culture.'
  },
  { 
    name: 'Meghalaya', 
    image: 'https://travloger.in/wp-content/uploads/2024/06/1-2.png', 
    crafts: [
      { name: 'Bamboo & Cane Craft', description: 'Baskets, mats, and furniture woven with bamboo and cane.', image: 'https://tse4.mm.bing.net/th/id/OIP.BY4GgStRyEgBliqai1eargAAAA?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' },
      { name: 'Eri Silk Weaving', description: 'Known as "peace silk", it\'s woven into warm shawls and fabrics.', image: 'https://mapacademy.io/wp-content/uploads/2023/04/eri-silk-5l.jpg' }
    ],
    microtext: 'Abode of Clouds', 
    badge: '☁️',
    fullDescription: 'Artisans use bamboo and cane to create essentials, reflecting sustainable living and Eri silk weaving traditions.'
  },
  { 
    name: 'Mizoram', 
    image: 'https://tse2.mm.bing.net/th/id/OIP.GcO9eJ6aN2m1HHN1-Wh0BAHaEK?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3', 
    crafts: [
      { name: 'Puan Weaving', description: 'Handwoven traditional shawls with bold patterns and vibrant colors.', image: 'https://tse3.mm.bing.net/th/id/OIP.KPEK3PHlVMZMCnG87K5wEQAAAA?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' },
      { name: 'Bamboo Crafts', description: 'Intricate items like the Mizo traditional hat (Khumbeu) are made from bamboo.', image: 'https://www.re-thinkingthefuture.com/wp-content/uploads/2022/07/A7341-Traditional-Crafts-of-India-Bamboo-Handicrafts-Image-5-1024x682.jpg' }
    ],
    microtext: 'Land of the Highlanders', 
    badge: '🏔️',
    fullDescription: 'Mizoram’s weaving traditions, especially the Mizo puan shawls, are integral to its cultural identity.'
  },
  { 
    name: 'Nagaland', 
    image: 'https://th.bing.com/th/id/R.2ed7335c3aee0b158a0fba0479be420b?rik=AUUXVdzf3%2bewCg&riu=http%3a%2f%2ffootloosedev.com%2fwp-content%2fuploads%2f2017%2f12%2fnagaland-village.jpg&ehk=2WN1IIlbb4NGdwmR0iADtvdaM9XFS1eQnCBZda2vKa4%3d&risl=&pid=ImgRaw&r=0', 
    crafts: [
      { name: 'Naga Shawls', description: 'Handwoven shawls with symbolic motifs representing tribal identity.', image: 'https://www.oddessemania.in/wp-content/uploads/2023/10/shawl-1-1024x698.jpg' },
      { name: 'Wood Carving', description: 'Intricately carved wood used in tribal houses and ceremonial objects.', image: 'https://c8.alamy.com/comp/2E8JGP6/traditional-artist-woodwork-in-the-naga-heritage-village-kisama-nagaland-india-2E8JGP6.jpg' }
    ],
    microtext: 'Land of Festivals', 
    badge: '🥁',
    fullDescription: 'Nagaland’s crafts are tied to its tribal culture, with distinctive shawls and wooden carvings.'
  },
  { 
    name: 'Odisha', 
    image: 'https://th.bing.com/th/id/R.da4025758f0ff65b1e95851897419174?rik=hv929O46kOkXbQ&riu=http%3a%2f%2ftravelguide.easemytrip.com%2fcityGuideImagePath%2fOdisha1.jpg&ehk=98VfxT7Q3D1hJfl%2bT09lB11ZccUbVv8fPwLhQxYVIVU%3d&risl=&pid=ImgRaw&r=0', 
    crafts: [
      { name: 'Pattachitra', description: 'Traditional cloth scroll paintings depicting mythological stories.', image: 'https://c9admin.cottage9.com/uploads/2499/Exploring-the-Significance-of-Pattachitra-Art-in-Jagannath-Ratha-Yatra.jpg' },
      { name: 'Silver Filigree', description: 'Intricate jewelry and artifacts made of fine silver wires (Tarakasi).', image: 'https://www.iasgyan.in/ig-uploads/images/SILVER_FILIGREE_WORK.jpg' }
    ],
    microtext: 'Land of Artistic Heritage', 
    badge: '✨',
    fullDescription: 'Celebrated for its Pattachitra paintings, appliqué work, and silver filigree, reflecting a rich temple heritage.'
  },
  { 
    name: 'Punjab', 
    image: 'https://th.bing.com/th/id/R.53476bd70342f3a5bbc90be30d14d569?rik=CaKlFWQ%2f0%2fOHUA&riu=http%3a%2f%2fwallpapercave.com%2fwp%2fd63W8Ok.jpg&ehk=jH4sVnJMzEDsXSSuGohFlG0Sy3pKvL6%2fffN0I7l%2fgcc%3d&risl=&pid=ImgRaw&r=0', 
    crafts: [
      { name: 'Phulkari', description: 'Colorful embroidery with floral motifs, often on shawls and dupattas.', image: 'https://tse2.mm.bing.net/th/id/OIP.w8usGLJ9yx0IhJX2uveQLwHaE8?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' },
      { name: 'Juttis', description: 'Handcrafted leather footwear decorated with embroidery and beads.', image: 'https://i.pinimg.com/originals/d1/ca/55/d1ca550f0e57070b2a0a0f8ab2eadafe.jpg' }
    ],
    microtext: 'Spirit of Vibrance', 
    badge: '🌸',
    fullDescription: 'Synonymous with Phulkari embroidery and juttis, celebrated for their vibrancy and connection to Punjabi traditions.'
  },
  { 
    name: 'Rajasthan', 
    image: 'https://d27k8xmh3cuzik.cloudfront.net/wp-content/uploads/2016/09/Gadisar-Lake-in-Rajasthan..jpg', 
    crafts: [
      { name: 'Blue Pottery', description: 'Distinctive pottery from Jaipur, glazed in striking blue patterns.', image: 'https://tse4.mm.bing.net/th/id/OIP.49tpWh-Vwnd3gB_Gt4qWJQHaFO?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' },
      { name: 'Block Printing', description: 'Textiles hand-printed with carved wooden blocks (Sanganeri, Bagru).', image: 'https://lilatravelindia.com/wp-content/uploads/2023/04/Block-Printing-in-Rajasthan.jpg' }
    ],
    microtext: 'Land of Royal Heritage', 
    badge: '👑',
    fullDescription: 'Rajasthan’s crafts include blue pottery, block printing, and miniature paintings, reflecting its royal legacy.'
  },
  { 
    name: 'Sikkim', 
    image: 'https://www.oyorooms.com/travel-guide/wp-content/uploads/2021/06/Sikkim-4-1.jpg', 
    crafts: [
      { name: 'Thangka Painting', description: 'Buddhist scroll paintings rich with symbolic imagery.', image: 'https://cdn.magicdecor.in/com/2024/04/25123807/shutterstock_2340233521.jpg' },
      { name: 'Carpet Weaving', description: 'Hand-knotted woolen carpets with traditional Buddhist motifs.', image: 'https://tse3.mm.bing.net/th/id/OIP.Y5_B2QJIBZX7Eg74sReYHAHaEs?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' }
    ],
    microtext: 'Valley of Rice', 
    badge: '🌾',
    fullDescription: 'Sikkim’s handicrafts draw from its Buddhist heritage, with thangka painting and carpet weaving being central.'
  },
  { 
    name: 'Tamil Nadu', 
    image: 'https://blogs.revv.co.in/blogs/wp-content/uploads/2020/05/meenakshi-temple-in-Madurai.jpg', 
    crafts: [
      { name: 'Tanjore Painting', description: 'Religious paintings with gold foil, gems, and vivid colors.', image: 'https://tse1.mm.bing.net/th/id/OIP.EWykTkZRy1hIUP5MKbF-dAHaJK?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' },
      { name: 'Kanchipuram Silk', description: 'Exquisite silk sarees with contrasting borders and temple designs.', image: 'https://singhanias.in/cdn/shop/articles/e6252f1bad17120f163443a8baced97e.jpg?v=1679123373&width=1950' }
    ],
    microtext: 'Cradle of Dravidian Culture', 
    badge: '🪔',
    fullDescription: 'World-famous for Kanchipuram silks and Tanjore paintings, deeply tied to temple traditions.'
  },
  { 
    name: 'Telangana', 
    image: 'https://wallpaperaccess.com/full/10698896.jpg', 
    crafts: [
      { name: 'Bidriware', description: 'Black metal inlay work with pure silver designs.', image: 'https://i.pinimg.com/736x/77/5f/0b/775f0be30ce628b350986f7e51b02ee0.jpg' },
      { name: 'Nirmal Paintings', description: 'Paintings on wood with gold highlights, depicting epics and folklore.', image: 'https://uniquelytelangana.in/wp-content/uploads/2023/06/71QsiiPHaHL-768x541.jpg' }
    ],
    microtext: 'Land of Charminar', 
    badge: '🏯',
    fullDescription: 'Home to Bidri metalwork and Nirmal paintings, crafts admired for their elegance and historical roots.'
  },
  { 
    name: 'Tripura', 
    image: 'https://tse3.mm.bing.net/th/id/OIP.YWEC8zJU5CCnZAohAdM0OwHaEj?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3', 
    crafts: [
      { name: 'Handloom Weaving', description: 'Traditional garments (Risa, Rignai) woven on bamboo looms.', image: 'https://i.etsystatic.com/21278831/r/il/b9d313/2461600000/il_794xN.2461600000_je2t.jpg' },
      { name: 'Bamboo Craft', description: 'Household items and decorative pieces made from bamboo.', image: 'https://5.imimg.com/data5/SELLER/Default/2023/9/348443365/XL/QF/AY/66656808/handicraft-500x500.png' }
    ],
    microtext: 'Queen of the Hills', 
    badge: '👑',
    fullDescription: 'Tripura’s craft heritage includes fine handloom textiles and bamboo works, blending functionality with artistry.'
  },
  { 
    name: 'Uttar Pradesh', 
    image: 'https://media.istockphoto.com/photos/boat-with-guys-in-varanasi-picture-id537455282?k=20&m=537455282&s=612x612&w=0&h=IHt7ObITyEXYXe3fogs083cKoJQQpc2crw1KLlhSXZg=', 
    crafts: [
      { name: 'Chikankari', description: 'Delicate and intricate hand embroidery from Lucknow.', image: 'https://www.alphonsostories.com/AlphonSoStoriesImages/downloads/The-Embroidered-Art-of-Chikankari-5.jpg' },
      { name: 'Banarasi Sarees', description: 'Silk sarees with gold and silver brocade (zari) designs.', image: 'https://5.imimg.com/data5/ANDROID/Default/2022/7/TC/UQ/WV/150148512/product-jpeg-500x500.jpg' }
    ],
    microtext: 'Heartland of Heritage', 
    badge: '🏰',
    fullDescription: 'Famed for Chikankari embroidery and Banarasi silks, representing the zenith of textile craftsmanship.'
  },
  { 
    name: 'Uttarakhand', 
    image: 'https://tse3.mm.bing.net/th/id/OIP.cYGSKTfq9zFk2Tx82aXCTQHaEK?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3', 
    crafts: [
      { name: 'Aipan Art', description: 'Ritualistic paintings made with red clay and rice paste.', image: 'https://www.gitagged.com/wp-content/uploads/2023/09/AIPAN-002-GANESHA-MANDALA-1-2FT-1.jpg' },
      { name: 'Ringaal Craft', description: 'Products crafted from a special type of Himalayan bamboo.', image: 'https://tse1.mm.bing.net/th/id/OIP.VyvR4EnKpnq3CkTNe-1cVwHaGJ?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' }
    ],
    microtext: 'Land of Gods', 
    badge: '⛰️',
    fullDescription: 'Uttarakhand’s crafts like Aipan art and bamboo work reflect its spiritual heritage and mountain life.'
  },
  { 
    name: 'West Bengal', 
    image: 'https://wallpapercave.com/wp/wp7929203.jpg', 
    crafts: [
      { name: 'Kantha Embroidery', description: 'Running stitch embroidery used on sarees, quilts, and stoles.', image: 'https://tse2.mm.bing.net/th/id/OIP.aP-NDnpQ7W2x_zE5FXuCrgAAAA?r=0&cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3' },
      { name: 'Terracotta Crafts', description: 'Sculptures and temple art made from baked clay (e.g., Bankura horse).', image: 'https://i.pinimg.com/originals/93/7e/8a/937e8a80fe236d2d74782739f159dce4.jpg' }
    ],
    microtext: 'Cultural Capital of India', 
    badge: '📚',
    fullDescription: 'Known for Kantha embroidery and terracotta temples that have shaped India’s cultural renaissance.'
  },

  { 
    name: 'Andaman & Nicobar', 
    image: 'https://wallpapercave.com/wp/T3c87mH.jpg', 
    crafts: [
      { name: 'Shell Craft', description: 'Artworks and jewelry crafted from seashells.', image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEidpNB5i09l8BoNeDNHCl60NR5Or0d0EBgYaj4A1A21lcDOjXZIXd9CNkMVZlK5tsSXvhPCSHrz0xRW80-IqPxyvFn3vo2yJJYJXD2SwvqZltFAbD5yzxvHVLQr3T41uOo3IgnYlGYxLA_QeMn9EnOyGou511xOMCjqbeX5fdz1V6d7QciJnpKEPhXbYizR/s608/Handicraft%20Shell.jpg' },
      { name: 'Wood Carving', description: 'Intricate wooden handicrafts reflecting island life.', image: 'https://www.indiaunveiled.in/sites/default/files/Cocunut%20craft.jpg' }
    ],
    microtext: 'Emerald Islands', 
    badge: '🐚',
    fullDescription: 'Known for crafts made of natural materials like shells, coconut, and wood, reflecting coastal culture.'
  },
  { 
    name: 'Chandigarh', 
    image: 'https://i.pinimg.com/originals/66/84/1e/66841e772917bea2d18048b98ce430fb.jpg', 
    crafts: [
      { name: 'Modernist Art', description: 'Inspired by Le Corbusier\'s architecture and design philosophy.', image: 'https://i.pinimg.com/originals/4e/62/f4/4e62f41d6a4853596184290d77513950.jpg' },
      { name: 'Phulkari', description: 'Traditional embroidery shared with Punjab and Haryana.', image: 'https://miro.medium.com/v2/resize:fit:1000/1*fQtB756C-SfRU57LiA1l7g.jpeg' }
    ],
    microtext: 'The City Beautiful', 
    badge: '🌆',
    fullDescription: 'Chandigarh’s crafts borrow from its neighbors, with Phulkari being popular, alongside modern art.'
  },
  { 
    name: 'Dadra, Nagar Haveli & Daman, Diu', 
    image: 'https://th.bing.com/th/id/R.2aa0b800f880c70e1f46915ed0dca3c1?rik=3C7phOEv4AVrWA&riu=http%3a%2f%2fi.imgur.com%2fg1dEGws.jpg&ehk=TruqYCd%2fNotVTA4PtMQKgtouPFqTCX6cy47Oj1xZFvg%3d&risl=&pid=ImgRaw&r=0', 
    crafts: [
      { name: 'Warli Painting', description: 'Tribal paintings depicting daily life and rituals.', image: 'https://pbs.twimg.com/media/C0WfGoHVIAAxcP8.jpg' },
      { name: 'Mat Weaving', description: 'Handmade mats and baskets from palm leaves.', image: 'https://cdnbbsr.s3waas.gov.in/s371e09b16e21f7b6919bbfc43f6a5b2f0/uploads/2020/10/2020101925-300x197.jpg' }
    ],
    microtext: 'Fusion of Cultures', 
    badge: '🌊',
    fullDescription: 'The union territory reflects tribal and coastal cultures, with Warli art and mat weaving at its core.'
  },
  { 
    name: 'Delhi',
    image: 'https://www.transindiatravels.com/wp-content/uploads/red-fort-delhi-1-768x576.jpg',
    crafts: [
      { name: 'Zardozi Embroidery', description: 'Luxurious hand embroidery using gold and silver threads and beads.', image: 'https://cdn.shopify.com/s/files/1/0612/3670/7497/files/GRGERGEG_beautiful_zardozi_work_embroidery_real_4k_image_36a82763-d436-4437-9c69-1e753315c382_1024x1024.png?v=1675704140' },
      { name: 'Meenakari Jewelry', description: 'Intricate enamel work on jewelry and artifacts.', image: 'https://cdn0.weddingwire.in/articles/images/3/3/2/5/img_5233/meenakari-jewellery-purab-paschim-types-of-meenakari-jewellery-patterns.jpg' }
    ],
    microtext: 'City of Crafts & Culture',
    badge: '🏛️',
    fullDescription: 'Delhi is a hub of cultural fusion, with crafts like Zardozi embroidery and Meenakari thriving in its markets.'
  },
  { 
    name: 'Jammu & Kashmir',
    image: 'https://img.veenaworld.com/wp-content/uploads/2023/01/shutterstock_2044050407-scaled.jpg',
    crafts: [
      { name: 'Pashmina/Kani Shawls', description: 'World-famous shawls known for their softness and intricate weaving.', image: 'https://i.pinimg.com/736x/3a/b4/b0/3ab4b07cb5ca8d57a6937953a56f0cb3.jpg' },
      { name: 'Papier-Mâché', description: 'Colorful, hand-painted decorative items made from paper pulp.', image: 'https://cdn.yehaindia.com/wp-content/uploads/2021/02/Paper-Mache-Kashmir.jpg' }
    ],
    microtext: 'Paradise on Earth',
    badge: '🏔️',
    fullDescription: 'Globally renowned for its luxurious Pashmina shawls, intricate carpets, and vibrant papier-mâché crafts.'
  },
  { 
    name: 'Ladakh',
    image: 'https://d27k8xmh3cuzik.cloudfront.net/wp-content/uploads/2016/02/Stakna-monastery-in-Leh-Ladakh.jpg',
    crafts: [
      { name: 'Thangka Painting', description: 'Tibetan Buddhist paintings depicting deities, mandalas, or scenes.', image: 'https://th.bing.com/th/id/R.ddf8bd13e7d498cba76daba1d05dd02d?rik=IoHWETjXLQt6SA&riu=http%3a%2f%2ftraditionalartofnepal.com%2fwp-content%2fuploads%2f2015%2f05%2fCanvas-Life-of-Buddha-painting.jpg&ehk=9uHTVd6bkoc9EjO7FAzciMsTQmxOBw862g7iWssMa0Q%3d&risl=&pid=ImgRaw&r=0' },
      { name: 'Pashmina Weaving', description: 'Home to the Changthangi goat, the source of the finest Pashmina wool.', image: 'https://www.mapsofindia.com/ci-moi-images/my-india/Pashmina-Shawls-of-Kashmir-665x444.jpg' }
    ],
    microtext: 'Land of High Passes',
    badge: '🙏',
    fullDescription: 'Ladakh\'s crafts are deeply influenced by Tibetan Buddhism, with Thangka painting and Pashmina weaving being central.'
  },
  { 
    name: 'Lakshadweep',
    image: 'https://static.toiimg.com/thumb/msid-97054301,width-748,height-499,resizemode=4,imgsize-152848/The-Union-Territory.jpg',
    crafts: [
      { name: 'Coconut Craft', description: 'Items made from coconut shells and fibers.', image: 'https://tasidola.com/wp-content/uploads/2015/12/Coconut-Shell-Craft-Animal-Shape1.jpg' },
      { name: 'Coral Crafts', description: 'Jewelry and decorative items made from coral (now regulated).', image: 'https://thf.bing.com/th/id/OIP.OTbc3ddNZIWi7eR3Nvyt4QHaEV?r=0&o=7&cb=thfc1rm=3&rs=1&pid=ImgDetMain&o=7&rm=3' }
    ],
    microtext: 'Coral Paradise',
    badge: '🏝️',
    fullDescription: 'The islands\' crafts are derived from the sea, with coconut and shell crafts being prominent.'
  },
  { 
    name: 'Puducherry',
    image: 'https://assets.traveltriangle.com/blog/wp-content/uploads/2017/05/mahe-beach-kb060592.jpg',
    crafts: [
      { name: 'Handmade Paper', description: 'High-quality paper and products made through traditional methods.', image: 'https://tiimg.tistatic.com/fp/2/005/015/handmade-paper-stationery-box-172.jpg' },
      { name: 'Terracotta', description: 'Unique pottery and figurines reflecting Franco-Tamil heritage.', image: 'https://i.pinimg.com/736x/22/c2/af/22c2afea054db4441a28e5b8d08a3e70--chennai-terracotta.jpg' }
    ],
    microtext: 'The French Riviera of the East',
    badge: '🇫🇷',
    fullDescription: 'Known for its handmade paper, leather crafts, and pottery that blends French and Tamil aesthetics.'
  },
];

const StateCard = ({ state, onNavigate }) => (
  <div 
    className="state-card"
    onClick={() => onNavigate(`state/${state.name.toLowerCase().replace(/[\s&,]+/g, '-')}`)}
  >
    <div className="state-card-image" style={{ backgroundImage: `url(${state.image})` }}></div>
    <div className="state-info">
      <div className="state-header">
        <span className="craft-badge">{state.badge}</span>
        <h3 className="state-name">{state.name}</h3>
      </div>
      <p className="state-microtext">{state.microtext}</p>
      
      <div className="state-crafts-container">
        <p className="crafts-title">Featured Crafts:</p>
        <div className="crafts-list">
            {state.crafts.slice(0, 2).map(craft => (
              <div key={craft.name} className="craft-item" title={craft.description}>
                <img src={craft.image} alt={craft.name} className="craft-item-image" />
                <span className="craft-item-name">{craft.name}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  </div>
);


const AllStatesPage = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStates, setFilteredStates] = useState(allStatesData);

  useEffect(() => {
    const sortedStates = [...allStatesData].sort((a, b) => a.name.localeCompare(b.name));
    
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = sortedStates.filter(state => {
      return (
        state.name.toLowerCase().includes(lowercasedFilter) ||
        state.crafts.some(craft => craft.name.toLowerCase().includes(lowercasedFilter))
      );
    });
    setFilteredStates(filtered);
  }, [searchTerm]);
  
  return (
    <div className="all-states-page">
      <div className="page-header">
        <h1>Explore by State</h1>
        <p>Discover the rich tapestry of Indian craftsmanship, one state at a time.</p>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by state or craft (e.g., 'Pashmina')"
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
    return allStatesData.find(state => state.name.toLowerCase().replace(/[\s&,]+/g, '-') === stateSlug);
};

export default AllStatesPage;
