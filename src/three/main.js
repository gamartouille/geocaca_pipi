import * as THREE from "three";

export class ThreeExperience {
  constructor(container, onFloorClick) {
    this.container = container;
    this.onFloorClick = onFloorClick;

    this.init();
    this.setupEventListeners();
    this.animate();
  }

  init() {
    // ----- SCENE -----
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 50, 250);

    // ----- CAMERA -----
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(100, 50, 100);
    this.camera.lookAt(0, 0, 0);

    // ----- RENDERER -----
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // ----- RAYCASTER -----
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredFloor = null;
    this.interactiveFloors = [];

    // ----- CONTROLS STATE -----
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotation = { x: 0.3, y: 0.8 };
    this.dragDistance = 0;
    this.zoomDistance = 100;
    
    // Touch support
    this.touchStartDistance = 0;
    this.isTouchDevice = () => {
      return (
        (typeof window !== 'undefined' && 
        ('ontouchstart' in window ||
          navigator.maxTouchPoints > 0 ||
          navigator.msMaxTouchPoints > 0))
      );
    };

    this.createWorld();
    this.createLighting();
  }

  createWorld() {
    // ----- HAUTEUR DE SURÉLÉVATION -----
    const elevationHeight = 2.4; // Hauteur d'un étage

    // ----- SOL -----
    const groundGeometry = new THREE.PlaneGeometry(300, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a7a5a,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = elevationHeight;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // ----- MATÉRIAUX -----
    this.materials = {
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        metalness: 0.1,
        roughness: 0.1,
        transparent: true,
        opacity: 0.4,
        envMapIntensity: 1,
      }),
      aluminum: new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        metalness: 0.8,
        roughness: 0.3,
      }),
      concrete: new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        roughness: 0.8,
        transparent: true,
        opacity: 0.8,
      }),
      steel: new THREE.MeshStandardMaterial({
        color: 0x707070,
        metalness: 0.9,
        roughness: 0.2,
      }),
    };

    // ----- BÂTIMENT -----
    const buildingGroup = new THREE.Group();
    buildingGroup.position.y = elevationHeight;
    this.createBasement(buildingGroup);
    this.createGeodataWings(buildingGroup);
    this.createPontsWings(buildingGroup);
    this.createAtrium(buildingGroup);
    this.createEntrance(buildingGroup);
    this.scene.add(buildingGroup);

    // ----- ENVIRONNEMENT -----
    this.createParking(elevationHeight);
    this.createTrees(elevationHeight);
    this.createPaths(elevationHeight);
  }

  createInteractiveFloor(x, y, z, width, depth, floorNumber, wing, wingNumber) {
    const floorHeight = 2.4;
    const defaultFloorColor = 0x00ccff;
    const floorGeometry = new THREE.BoxGeometry(width, floorHeight, depth);
    const floorMaterial = new THREE.MeshPhysicalMaterial({
      color: defaultFloorColor,
      metalness: 0.2,
      roughness: 0.4,
      transparent: true,
      opacity: 0.75,
      ior: 1.5,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(x, y, z);
    floor.castShadow = true;
    floor.receiveShadow = true;

    floor.userData = {
      floorNumber,
      wing,
      wingNumber,
      isInteractive: true,
      originalColor: defaultFloorColor,
    };

    this.interactiveFloors.push(floor);

    const lineGeometry = new THREE.BoxGeometry(width + 0.1, 0.05, depth + 0.1);
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.set(x, y - floorHeight / 2, z);

    return { floor, line };
  }
  
  createGlassArium(x, z, length) {
      const group = new THREE.Group();
      
      const baseGeometry = new THREE.BoxGeometry(3, 10, length);
      const base = new THREE.Mesh(baseGeometry, this.materials.concrete);
      base.position.set(x, 5, z);
      base.castShadow = true;
      group.add(base);
      
      const canopyGeometry = new THREE.CylinderGeometry(2, 2, length, 16, 1, true, 0, Math.PI);
      const canopy = new THREE.Mesh(canopyGeometry, this.materials.glass);
      canopy.rotation.z = Math.PI / 2;
      canopy.rotation.x = Math.PI / 2;
      canopy.position.set(x, 10, z);
      group.add(canopy);
      
      const cableGeometry = new THREE.CylinderGeometry(0.05, 0.05, 15, 8);
      const cableMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x404040,
        metalness: 0.9,
        roughness: 0.1
      });
      
      const cable1 = new THREE.Mesh(cableGeometry, cableMaterial);
      cable1.position.set(x, 7, z);
      cable1.rotation.x = Math.PI / 4;
      group.add(cable1);
      
      const cable2 = new THREE.Mesh(cableGeometry, cableMaterial);
      cable2.position.set(x, 7, z);
      cable2.rotation.x = -Math.PI / 4;
      group.add(cable2);
      
      for (let i = -length/2; i <= length/2; i += 4) {
        const beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, 8, 8);
        const beam = new THREE.Mesh(beamGeometry, this.materials.steel);
        beam.position.set(x, 10, z + i);
        group.add(beam);
      }
      
      return group;
  }

  createBasement(buildingGroup) {
    const basementGroup = new THREE.Group();
    
    // Dimensions du sous-sol - agrandi pour couvrir tout l'atrium et éviter les conflits
    const atriumLength = 40;
    const atriumWidth = 18; // Légèrement plus large que l'atrium (16) pour éviter les chevauchements
    const basementHeight = 5; // Même hauteur qu'un étage
    
    // Plancher du sous-sol (sol) - CLIQUABLE
    const floorGeometry = new THREE.BoxGeometry(atriumWidth, 0.2, atriumLength);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x404040,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, -basementHeight / 2, 0);
    floor.receiveShadow = true;
    
    // Rendre le plancher cliquable
    floor.userData = {
      floorNumber: -1,
      wing: 'RDC',
      wingNumber: 0,
      isInteractive: true,
    };
    this.interactiveFloors.push(floor);
    
    basementGroup.add(floor);
    
    // Ligne de délimitation du sous-sol
    const lineGeometry = new THREE.BoxGeometry(atriumWidth + 0.1, 0.05, atriumLength + 0.1);
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.set(0, -basementHeight / 2 - 0.1, 0);
    basementGroup.add(line);
    
    // Plafond du sous-sol
    const ceilingGeometry = new THREE.BoxGeometry(atriumWidth, 0.2, atriumLength);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.set(0, basementHeight / 2 - 0.1, 0);
    ceiling.receiveShadow = true;
    basementGroup.add(ceiling);
    
    // Murs du sous-sol
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x505050,
      roughness: 0.8,
    });
    
    // Mur avant
    const frontWallGeometry = new THREE.BoxGeometry(atriumWidth, basementHeight, 0.3);
    const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    frontWall.position.set(0, 0, -atriumLength / 2);
    frontWall.castShadow = true;
    basementGroup.add(frontWall);
    
    // Mur arrière
    const backWallGeometry = new THREE.BoxGeometry(atriumWidth, basementHeight, 0.3);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, 0, atriumLength / 2);
    backWall.castShadow = true;
    basementGroup.add(backWall);
    
    // Mur gauche
    const leftWallGeometry = new THREE.BoxGeometry(0.3, basementHeight, atriumLength);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-atriumWidth / 2, 0, 0);
    leftWall.castShadow = true;
    basementGroup.add(leftWall);
    
    // Mur droit
    const rightWallGeometry = new THREE.BoxGeometry(0.3, basementHeight, atriumLength);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(atriumWidth / 2, 0, 0);
    rightWall.castShadow = true;
    basementGroup.add(rightWall);
    
    // Poutres de support
    const beamMaterial = new THREE.MeshStandardMaterial({
      color: 0x707070,
      metalness: 0.6,
      roughness: 0.3,
    });
    
    // Poutres horizontales (grille de support)
    for (let i = -atriumLength / 2 + 3; i <= atriumLength / 2 - 3; i += 8) {
      for (let j = -atriumWidth / 2 + 2; j <= atriumWidth / 2 - 2; j += 6) {
        const beamGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(j, 0, i);
        beam.castShadow = true;
        basementGroup.add(beam);
      }
    }
    
    // Colonnes de support verticales
    for (let i = -atriumLength / 2 + 8; i <= atriumLength / 2 - 8; i += 16) {
      for (let j = -atriumWidth / 2 + 3; j <= atriumWidth / 2 - 3; j += 8) {
        const columnGeometry = new THREE.CylinderGeometry(0.2, 0.2, basementHeight - 0.5, 8);
        const column = new THREE.Mesh(columnGeometry, beamMaterial);
        column.position.set(j, 0, i);
        column.castShadow = true;
        basementGroup.add(column);
      }
    }
    
    buildingGroup.add(basementGroup);
  }

  createGeodataWings(buildingGroup) {
    const floorHeight = 2.4;
    const geodataDepth = 12;
    const geodataWidth = 20;
    const geodataSpacing = 3;
    const geodataX = -geodataWidth / 2 - 8;
    const wings = [
        { name: 'Cassini', number: 1, z: geodataDepth + geodataSpacing },
        { name: 'Laplace', number: 2, z: 0 },
        { name: 'Maupertuis', number: 3, z: -(geodataDepth + geodataSpacing) }
    ];

    wings.forEach((wing, index) => {
        for (let i = 0; i < 5; i++) {
            const result = this.createInteractiveFloor(
                geodataX,
                floorHeight / 2 + i * floorHeight,
                wing.z,
                geodataWidth,
                geodataDepth,
                i,
                wing.name,
                wing.number
            );
            buildingGroup.add(result.floor, result.line);
        }
        if (index < wings.length -1) {
            const glassArium = this.createGlassArium(geodataX, wing.z - geodataDepth/2 - geodataSpacing/2, geodataSpacing);
            buildingGroup.add(glassArium);
        }
    });
  }

  createPontsWings(buildingGroup) {
    const floorHeight = 2.4;
    const pontsDepth = 12;
    const pontsWidth = 40;
    const pontsSpacing = 3;
    const pontsX = pontsWidth / 2 + 8;
    const wings = [
        { name: 'Belgrand', number: 1, z: pontsDepth + pontsSpacing },
        { name: 'Belgrand', number: 2, z: 0 },
        { name: 'Belgrand', number: 3, z: -(pontsDepth + pontsSpacing) }
    ];

    wings.forEach((wing, index) => {
        for (let i = 0; i < 5; i++) {
            const result = this.createInteractiveFloor(
                pontsX,
                floorHeight / 2 + i * floorHeight,
                wing.z,
                pontsWidth,
                pontsDepth,
                i,
                wing.name,
                wing.number
            );
            buildingGroup.add(result.floor, result.line);
        }
        if (index < wings.length - 1) {
            const glassArium = this.createGlassArium(pontsX, wing.z - pontsDepth/2 - pontsSpacing/2, pontsSpacing);
            buildingGroup.add(glassArium);
        }
    });
  }

  createAtrium(buildingGroup) {
    const atriumGroup = new THREE.Group();
    const atriumLength = 40;
    const atriumWidth = 16;

    const atriumBase = new THREE.Mesh(
        new THREE.BoxGeometry(atriumWidth, 10, atriumLength),
        this.materials.concrete
    );
    atriumBase.position.set(0, 5, 0);
    atriumBase.castShadow = true;
    atriumGroup.add(atriumBase);

    const geodataX = -20 / 2 - 8;
    const pontsX = 40 / 2 + 8;
    const leftEdge = geodataX - 20/2;
    const rightEdge = pontsX + 40/2;
    const totalBuildingWidth = rightEdge - leftEdge;
    const roofCenterX = (leftEdge + rightEdge) / 2;

    const roofGlass = new THREE.Mesh(
        new THREE.BoxGeometry(totalBuildingWidth, 0.3, atriumLength),
        this.materials.glass
    );
    roofGlass.position.set(roofCenterX, 13, 0);
    atriumGroup.add(roofGlass);

    const supportBeamGeometry = new THREE.BoxGeometry(totalBuildingWidth, 0.4, 0.4);
    for (let i = -atriumLength/2; i <= atriumLength/2; i += 8) {
      const beam = new THREE.Mesh(supportBeamGeometry, this.materials.steel);
      beam.position.set(roofCenterX, 13.2, i);
      atriumGroup.add(beam);
    }

    const mainCanopyGeometry = new THREE.CylinderGeometry(4, 4, atriumLength, 16, 1, true, 0, Math.PI);
    const canopy1 = new THREE.Mesh(mainCanopyGeometry, this.materials.glass);
    canopy1.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    canopy1.position.set(-4, 11, 0);
    atriumGroup.add(canopy1);

    const canopy2 = canopy1.clone();
    canopy2.position.set(4, 11, 0);
    atriumGroup.add(canopy2);

    const beamGeometry = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
    for (let i = -atriumLength/2; i <= atriumLength/2; i += 5) {
      const beam1 = new THREE.Mesh(beamGeometry, this.materials.steel);
      beam1.position.set(-4, 12, i);
      atriumGroup.add(beam1);
      const beam2 = new THREE.Mesh(beamGeometry, this.materials.steel);
      beam2.position.set(4, 12, i);
      atriumGroup.add(beam2);
    }

    buildingGroup.add(atriumGroup);
  }

  createEntrance(buildingGroup) {
    const entranceGroup = new THREE.Group();
    const atriumLength = 40;
    const entranceZ = atriumLength / 2 + 3;

    const entranceCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 5, 16),
        this.materials.glass
    );
    entranceCylinder.position.set(0, 2.5, entranceZ);
    entranceGroup.add(entranceCylinder);

    const entranceRoof = new THREE.Mesh(
        new THREE.CylinderGeometry(3.5, 3.5, 0.5, 16),
        this.materials.aluminum
    );
    entranceRoof.position.set(0, 5.5, entranceZ);
    entranceGroup.add(entranceRoof);

    const doorGeometry = new THREE.BoxGeometry(0.2, 4, 2.5);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5, roughness: 0.3 });
    for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i;
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(
            Math.cos(angle) * 1.2,
            2.5,
            entranceZ + Math.sin(angle) * 1.2
        );
        door.rotation.y = angle;
        entranceGroup.add(door);
    }
    buildingGroup.add(entranceGroup);
  }

  createParking(elevationHeight) {
    // ----- PLACE GRISE UNIFORME DEVANT L'ÉCOLE (SUD) -----
    const plazaGeometry = new THREE.PlaneGeometry(200, 140);
    const plazaMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x888888,
      roughness: 0.8,
      metalness: 0.05
    });
    const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(50, elevationHeight+0.01, -30);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // ----- ROUTE AU SUD AVEC TROTTOIR -----
    const roadGeometry = new THREE.PlaneGeometry(60, 8);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x303030, 
      roughness: 0.9,
      metalness: 0.05
    });
    

    // ----- ROUTE À L'OUEST (NORD-SUD) AVEC TROTTOIR -----
    const westRoadGeometry = new THREE.PlaneGeometry(20, 500);
    const westRoad = new THREE.Mesh(westRoadGeometry, roadMaterial);
    westRoad.rotation.x = -Math.PI/2;
    // aligner la route transversale pour qu'elle croise la nouvelle route devant l'entrée
    const newRoadZ = 29; // position Z de la nouvelle route devant les bosquets
    westRoad.position.set(-50, elevationHeight + 0.2, newRoadZ);
    westRoad.receiveShadow = true;
    this.scene.add(westRoad);

    // Trottoir à l'ouest
    const westSidewalkGeometry = new THREE.PlaneGeometry(7.5, 500);
    const sidewalkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      roughness: 0.85
    });
    const westSidewalk = new THREE.Mesh(westSidewalkGeometry, sidewalkMaterial);
    westSidewalk.rotation.x = -Math.PI / 2;
    westSidewalk.position.set(-65, elevationHeight + 0.2, newRoadZ);
    westSidewalk.receiveShadow = true;
    this.scene.add(westSidewalk);
    //Trottoir à l'est
    const eastSidewalkGeometry = new THREE.PlaneGeometry(7.5, 500);
    const eastSidewalk = new THREE.Mesh(eastSidewalkGeometry, sidewalkMaterial);
    eastSidewalk.rotation.x = -Math.PI / 2;
    eastSidewalk.position.set(-35, elevationHeight + 0.1, newRoadZ);
    eastSidewalk.receiveShadow = true;
    this.scene.add(eastSidewalk);


    // ----- NOUVELLE ROUTE (EST-OUEST) DEVANT LES BOSQUETS : TROTTOIR - ROUTE - TROTTOIR -----
    // Dimensions
    const newRoadWidth = 120; // largeur totale de la zone (x)
    const newRoadDepth = 12; // épaisseur de la chaussée (z)
    const sidewalkWidth = 6; // largeur des trottoirs

    // Trottoir sud (côté bâtiment)
    const sidewalkSouthGeo = new THREE.PlaneGeometry(newRoadWidth+100, sidewalkWidth);
    const sidewalkSouth = new THREE.Mesh(sidewalkSouthGeo, sidewalkMaterial);
    sidewalkSouth.rotation.x = -Math.PI / 2;
    sidewalkSouth.position.set(70, elevationHeight + 0.2, newRoadZ+15 - newRoadDepth/2 - sidewalkWidth/2);
    sidewalkSouth.receiveShadow = true;
    this.scene.add(sidewalkSouth);

    // Chaussée
    const roadGeo = new THREE.PlaneGeometry(newRoadWidth+100, newRoadDepth);
    const road = new THREE.Mesh(roadGeo, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(70, elevationHeight + 0.2, newRoadZ+15);
    road.receiveShadow = true;
    this.scene.add(road);

    // Trottoir nord (côté extérieur)
    const sidewalkNorthGeo = new THREE.PlaneGeometry(newRoadWidth+100, sidewalkWidth);
    const sidewalkNorth = new THREE.Mesh(sidewalkNorthGeo, sidewalkMaterial);
    sidewalkNorth.rotation.x = -Math.PI / 2;
    sidewalkNorth.position.set(70, elevationHeight + 0.1, newRoadZ+15 + newRoadDepth/2 + sidewalkWidth/2);
    sidewalkNorth.receiveShadow = true;
    this.scene.add(sidewalkNorth);
  }

  createTrees(elevationHeight) {
    // Fonction pour créer un arbre
    const createTree = (x, z) => {
      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.6, 4, 8),
          new THREE.MeshStandardMaterial({ color: 0x8b4513 })
      );
      trunk.position.y = 2;
      trunk.castShadow = true;
      treeGroup.add(trunk);
      const foliage = new THREE.Mesh(
          new THREE.SphereGeometry(2.5, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0x2d5a2d })
      );
      foliage.position.y = 5;
      foliage.castShadow = true;
      treeGroup.add(foliage);
      treeGroup.position.set(x, elevationHeight, z);
      this.scene.add(treeGroup);
    };

    // ----- ARBRES SUR TOUTE LA LONGUEUR DE LA ROUTE SUD -----
    // Côté ouest - tout le long
    for (let z = -120; z <= 120; z += 8) {
      createTree(-67, z);
    }

    // Côté ouest - tout le long
    for (let z = -38; z <= 80; z += 8) {
      createTree(-38, z-40);
    }

    for (let z = -10; z <= 80; z += 8) {
      createTree(-38, z+65);
    }

    // ----- BOSQUETS LATÉRAUX ADAPTÉS À LA TAILLE DE CHAQUE AILE -----
    // On récupère les tailles des ailes (mêmes que dans createGeodataWings / createPontsWings)
    const entranceZ = 23; // Position z de la porte ronde
    const geodataWidth = 20;
    const geodataDepth = 12;
    const pontsWidth = 40;
    const pontsDepth = 12;
    const geodataX = -geodataWidth / 2-8+9; // position X de l'aile Geodata (gauche)
    const pontsX = pontsWidth / 2-8+10; // position X de l'aile Ponts (droite)

    const offsetAway = 6; // décalage vers l'extérieur pour éviter pénétrer le bâtiment
    const bosquetSpacing = 3; // espacement entre arbres
    let rows = 3; // nombre de lignes en profondeur

    // Bosquet côté gauche (aligné avec l'aile Geodata) — largeur = geodataWidth
    const leftCenterX = geodataX - offsetAway;
    const leftHalfWidth = geodataWidth / 2;
    for (let ix = -leftHalfWidth; ix <= leftHalfWidth - bosquetSpacing; ix += bosquetSpacing) {
      for (let rz = 0; rz < rows; rz++) {
        const x = Math.round(leftCenterX + ix);
        const z = entranceZ + 4 + rz * 1.8; // placé devant la porte, légèrement avancé
        createTree(x, z);
      }
    }

    // Bosquet côté droit (aligné avec l'aile Ponts) — largeur = pontsWidth
    const rightCenterX = pontsX + offsetAway;
    const rightHalfWidth = pontsWidth / 2;
    for (let ix = -rightHalfWidth + bosquetSpacing; ix <= rightHalfWidth; ix += bosquetSpacing) {
      for (let rz = 0; rz < rows; rz++) {
        const x = Math.round(rightCenterX + ix);
        const z = entranceZ + 4 + rz * 1.8;
        createTree(x, z);
      }
    }

    //Bosquets parcelle Y

    //côté gauche

    const leftparcelleX = geodataX - offsetAway;
    const lefparcelleHalfWidth = geodataWidth / 2;
    for (let ix = -lefparcelleHalfWidth; ix <= lefparcelleHalfWidth - bosquetSpacing; ix += bosquetSpacing) {
      for (let rz = 0; rz < rows; rz++) {
        const x = Math.round(leftparcelleX + ix);
        const z = entranceZ + 35 + rz * 1.8; // placé devant la porte, légèrement avancé
        createTree(x, z);
      }
    }

    //côté droit
    const rightparcelleX = pontsX + offsetAway;
    const rightparcelleHalfWidth = pontsWidth / 2;
    for (let ix = -rightparcelleHalfWidth + bosquetSpacing; ix <= rightparcelleHalfWidth; ix += bosquetSpacing) {
      for (let rz = 0; rz < rows; rz++) {
        const x = Math.round(rightparcelleX + ix);
        const z = entranceZ + 35 + rz * 1.8;
        createTree(x, z);
      }
    }


  }

  createPaths(elevationHeight) {
    // Les routes et trottoirs sont gérés dans createParking()
  }

  createLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(50, 50, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(4096, 4096);
    sunLight.shadow.camera.left = -150;
    sunLight.shadow.camera.right = 150;
    sunLight.shadow.camera.top = 150;
    sunLight.shadow.camera.bottom = -150;
    sunLight.shadow.camera.far = 200;
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x88ccff, 0.4);
    fillLight.position.set(-50, 30, -30);
    this.scene.add(fillLight);
  }

  setupEventListeners() {
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.addEventListener('wheel', this.onWheel);
    this.renderer.domElement.addEventListener('click', this.onClick);
    
    // Touch events
    this.renderer.domElement.addEventListener('touchstart', this.onTouchStart);
    this.renderer.domElement.addEventListener('touchmove', this.onTouchMove);
    this.renderer.domElement.addEventListener('touchend', this.onTouchEnd);
    
    window.addEventListener('resize', this.onWindowResize);
  }

  onMouseDown(e) {
    this.isDragging = true;
    this.dragDistance = 0;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  onMouseMove(e) {
    // Drag to rotate
    if (this.isDragging) {
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;
      this.dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
      this.rotation.y += deltaX * 0.005;
      this.rotation.x += deltaY * 0.005;
      this.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 2, this.rotation.x));
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    }

    // Hover detection
    this.mouse.x = (e.clientX / this.container.clientWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / this.container.clientHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveFloors);

    if (this.hoveredFloor && (!intersects.length || intersects[0].object !== this.hoveredFloor)) {
      // Restore original color
      const originalColor = this.hoveredFloor.userData.originalColor || 0x00ccff;
      this.hoveredFloor.material.color.setHex(originalColor);
      this.hoveredFloor = null;
      this.renderer.domElement.style.cursor = 'default';
    }

    if (intersects.length > 0 && intersects[0].object.userData.isInteractive) {
      this.hoveredFloor = intersects[0].object;
      this.hoveredFloor.material.color.setHex(0xcc5555);
      this.renderer.domElement.style.cursor = 'pointer';
    }
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onClick(e) {
    if (this.dragDistance > 5) return;

    this.mouse.x = (e.clientX / this.container.clientWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / this.container.clientHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveFloors);

    if (intersects.length > 0 && intersects[0].object.userData.isInteractive) {
      this.onFloorClick(intersects[0].object.userData);
    }
  }

  onTouchClick(touch) {
    // Tap detection on touch (only if minimal movement)
    if (this.dragDistance > 5) return;

    this.mouse.x = (touch.clientX / this.container.clientWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / this.container.clientHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveFloors);

    if (intersects.length > 0 && intersects[0].object.userData.isInteractive) {
      this.onFloorClick(intersects[0].object.userData);
    }
  }

  onWheel(e) {
    e.preventDefault();
    this.zoomDistance += e.deltaY * 0.05;
    this.zoomDistance = Math.max(40, Math.min(200, this.zoomDistance));
  }

  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  onTouchStart(e) {
    if (e.touches.length === 1) {
      // Single finger - rotation
      this.isDragging = true;
      this.dragDistance = 0;
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      // Two fingers - pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.touchStartDistance = Math.sqrt(dx * dx + dy * dy);
    }
  }

  onTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1 && this.isDragging) {
      // Single finger - rotation
      const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
      const deltaY = e.touches[0].clientY - this.previousMousePosition.y;
      this.dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
      
      this.rotation.y += deltaX * 0.005;
      this.rotation.x += deltaY * 0.005;
      this.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 2, this.rotation.x));
      
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      
      // Hover detection on touch
      this.mouse.x = (e.touches[0].clientX / this.container.clientWidth) * 2 - 1;
      this.mouse.y = -(e.touches[0].clientY / this.container.clientHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveFloors);

      if (this.hoveredFloor && (!intersects.length || intersects[0].object !== this.hoveredFloor)) {
        // Restore original color
        const originalColor = this.hoveredFloor.userData.originalColor || 0x00ccff;
        this.hoveredFloor.material.color.setHex(originalColor);
        this.hoveredFloor = null;
      }

      if (intersects.length > 0 && intersects[0].object.userData.isInteractive) {
        this.hoveredFloor = intersects[0].object;
        this.hoveredFloor.material.color.setHex(0xcc5555);
      }
    } else if (e.touches.length === 2) {
      // Two fingers - pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      if (this.touchStartDistance > 0) {
        const delta = this.touchStartDistance - currentDistance;
        this.zoomDistance += delta * 0.1;
        this.zoomDistance = Math.max(40, Math.min(200, this.zoomDistance));
        this.touchStartDistance = currentDistance;
      }
    }
  }

  onTouchEnd(e) {
    if (e.touches.length === 0) {
      // Check if it was a tap (minimal movement)
      if (this.dragDistance < 5 && e.changedTouches.length > 0) {
        this.onTouchClick(e.changedTouches[0]);
      }
      this.isDragging = false;
      this.touchStartDistance = 0;
    }
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    this.camera.position.x = this.zoomDistance * Math.sin(this.rotation.y) * Math.cos(this.rotation.x);
    this.camera.position.y = this.zoomDistance * Math.sin(this.rotation.x) + 25;
    this.camera.position.z = this.zoomDistance * Math.cos(this.rotation.y) * Math.cos(this.rotation.x);
    this.camera.lookAt(0, 8, 0);

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.animationFrameId);
    
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.removeEventListener('wheel', this.onWheel);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    
    // Remove touch events
    this.renderer.domElement.removeEventListener('touchstart', this.onTouchStart);
    this.renderer.domElement.removeEventListener('touchmove', this.onTouchMove);
    this.renderer.domElement.removeEventListener('touchend', this.onTouchEnd);
    
    window.removeEventListener('resize', this.onWindowResize);

    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
