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

    this.createWorld();
    this.createLighting();
  }

  createWorld() {
    // ----- SOL -----
    const groundGeometry = new THREE.PlaneGeometry(300, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a7a5a,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
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
        color: 0xd0d0d0,
        metalness: 0.8,
        roughness: 0.3,
      }),
      concrete: new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        roughness: 0.8,
      }),
      steel: new THREE.MeshStandardMaterial({
        color: 0x707070,
        metalness: 0.9,
        roughness: 0.2,
      }),
    };

    // ----- BÂTIMENT -----
    const buildingGroup = new THREE.Group();
    this.createGeodataWings(buildingGroup);
    this.createPontsWings(buildingGroup);
    this.createAtrium(buildingGroup);
    this.createEntrance(buildingGroup);
    this.scene.add(buildingGroup);

    // ----- ENVIRONNEMENT -----
    this.createParking();
    this.createTrees();
    this.createPaths();
  }

  createInteractiveFloor(x, y, z, width, depth, floorNumber, wing, wingNumber) {
    const floorHeight = 2.4;
    const defaultFloorColor = 0xc0c0c0;
    const floorGeometry = new THREE.BoxGeometry(width, floorHeight, depth);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: defaultFloorColor,
      roughness: 0.7,
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

    const beamGeometry = new THREE.CylinderGeometry(0.15, 0.15, 12, 8);
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

  createParking() {
    const parkingGeometry = new THREE.PlaneGeometry(60, 40);
    const parkingMaterial = new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.9 });
    const parking = new THREE.Mesh(parkingGeometry, parkingMaterial);
    parking.rotation.x = -Math.PI / 2;
    parking.position.set(0, 0.02, 70);
    parking.receiveShadow = true;
    this.scene.add(parking);

    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lineGeometry = new THREE.PlaneGeometry(0.2, 40);
    for (let i = 0; i < 10; i++) {
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.rotation.x = -Math.PI / 2;
        line.position.set(-25 + i * 5, 0.03, 70);
        this.scene.add(line);
    }
  }

  createTrees() {
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
      treeGroup.position.set(x, 0, z);
      this.scene.add(treeGroup);
    };
    createTree(-60, 40);
    createTree(-60, 0);
    createTree(-60, -40);
    createTree(60, 40);
    createTree(60, 0);
    createTree(60, -40);
  }

  createPaths() {
    const pathGeometry = new THREE.PlaneGeometry(5, 120);
    const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 });
    const path1 = new THREE.Mesh(pathGeometry, pathMaterial);
    path1.rotation.x = -Math.PI / 2;
    path1.position.set(-55, 0.01, 0);
    this.scene.add(path1);
    const path2 = path1.clone();
    path2.position.set(55, 0.01, 0);
    this.scene.add(path2);
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

    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.addEventListener('wheel', this.onWheel);
    this.renderer.domElement.addEventListener('click', this.onClick);
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
      this.hoveredFloor.material.color.setHex(0xc0c0c0);
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
    window.removeEventListener('resize', this.onWindowResize);

    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
