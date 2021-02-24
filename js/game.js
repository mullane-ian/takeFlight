



//color pallette
var Colors = {
	red:0xf25346,
	white:0xd8d0d1,
	brown:0x59332e,
	pink:0xF5986E,
	brownDark:0x23190f,
	blue:0x68c3c0,
};

//////////

// Game Variables
var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];

function resetGame(){

    //game object

    game = {
        speed:0,
          initSpeed:.00035,
          baseSpeed:.00035,
          targetBaseSpeed:.00035,
          incrementSpeedByTime:.0000025,
          incrementSpeedByLevel:.000005,
          distanceForSpeedUpdate:100,
          speedLastUpdate:0,

          distance:0,
          ratioSpeedDistance:50,
          energy:100,
          ratioSpeedEnergy:3,

          level:1,
          levelLastUpdate:0,
          distanceForLevelUpdate:1000,

          planeDefaultHeight:100,
          planeAmpHeight:80,
          planeAmpWidth:75,
          planeMoveSensivity:0.005,
          planeRotXSensivity:0.0008,
          planeRotZSensivity:0.0004,
          planeFallSpeed:.001,
          planeMinSpeed:1.2,
          planeMaxSpeed:1.6,
          planeSpeed:0,
          planeCollisionDisplacementX:0,
          planeCollisionSpeedX:0,

          planeCollisionDisplacementY:0,
          planeCollisionSpeedY:0,

          seaRadius:600,
          seaLength:800,
          //seaRotationSpeed:0.006,
          wavesMinAmp : 5,
          wavesMaxAmp : 20,
          wavesMinSpeed : 0.001,
          wavesMaxSpeed : 0.003,

          cameraFarPos:500,
          cameraNearPos:150,
          cameraSensivity:0.002,

          coinDistanceTolerance:15,
          coinValue:3,
          coinsSpeed:.5,
          coinLastSpawn:0,
          distanceForCoinsSpawn:50,

          ennemyDistanceTolerance:10,
          ennemyValue:15,
          ennemiesSpeed:.6,
          ennemyLastSpawn:0,
          distanceForEnnemiesSpawn:50,

          status : "playing",
    };

    fieldLevel.innerHTML = Math.floor(game.level);



}

//THREEJS RELATED VARIABLES
var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    renderer, 
    container,
    controls;

//SCREEN & MOUSE VARIBALES
var HEIGHT, WIDTH, mousePos = {x: 0, y:0}
    

function createScene() {
    // Get the width and the height of the screen,
	// use them to set up the aspect ratio of the camera 
    // and the size of the renderer.
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    // Create the scene
    scene = new THREE.Scene();
    
    
    // Create the camera
    aspectRatio = WIDTH/HEIGHT;
    fieldOfView = 50;
    nearPlane = .1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera (
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );

    // Add a fog effect to the scene; same color as the
	// background color used in the style sheet
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    
    // Set the position of the camera
    camera.position.x = 0;
    camera.position.y = game.planeDefaultHeight;
    camera.position.z = 200;
    

    // Create the renderer
    renderer = new THREE.WebGLRenderer({
    // Allow transparency to show the gradient background
    // we defined in the CSS
    alpha: true, 

    // Activate the anti-aliasing; this is less performant,
    // but, as our project is low-poly based, it should be fine :)
    antialias: true 

    });

    //Define the size of the rendererl in this case,
    // it will fill the entire screen
    renderer.setSize(WIDTH,HEIGHT);

    //Enable shadow rendering
    renderer.shadowMap.enabled = true;

    // Add the DOM element of the renderer to the 
    // container we created in the HTMl
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    // Listen to the screen: if the user resizes it
	// we have to update the camera and the renderer size
	window.addEventListener('resize', handleWindowResize, false);
}


// MOUSE AND SCREEN EVENTS
// As the screen size can change, we need to update the renderer 
// size and the camera aspect ratio:

function handleWindowResize() {
    // update height and width of the renderer and the camera
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH/HEIGHT;
    camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
    var tx = -1 + (event.touches[0].pageX / WIDTH)*2;
    var ty = 1 - (event.touches[0].pageY / HEIGHT)*2;
    mousePos = {x:tx, y:ty};
}

function handleTouchMove(event) {
    event.preventDefault();
    var tx = -1 + (event.touches[0].pageX / WIDTH)*2;
    var ty = 1 - (event.touches[0].pageY / HEIGHT)*2;
    mousePos = {x:tx, y:ty};
}

function handleMouseUp(event){
    if (game.status == "waitingReplay"){
        resetGame();
        hideReplay();
    }
}

function handleTouchEnd(event) {
    if(game.status == "waitingReplay"){
        resetGame();
        hideReplay();
    }
}






//LIGHTS 

var ambientLight, hemisphereLight, shadowLight;

function createLights() {
    // A hemisphere light is a gradient colored light
    // the first parameter is the sky color, the second parameter is the ground color
    // the third parameter is the intesity of the light

    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)

 

    
    // A directional light shines from a specific direction. 
	// It acts like the sun, that means that all the rays produced are parallel.
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);

    // Set the direction of the light
    shadowLight.position.set(150, 350, 350);

    // Allow Shadow casting
    shadowLight.castShadow = true;

    // define the visible area of the projected shadow
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // define the resolution of the shadow; the higher the better,
    // but also the more expensive and less perfomant
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;
    var ch = new THREE.CameraHelper(shadowLight.shadow.camera);

    // an ambient light modifies the global color of a scene and makes the shadows softer
    ambientLight = new THREE.AmbientLight(0xdc8874, .5);
    scene.add(ambientLight);

    //to activate the lights, just add them to the scene
    scene.add(hemisphereLight);
    scene.add(shadowLight);
    


}



// OBJECTS


// FIRST create a Sea Object

Sea = function(){
    // create the geometry (shape) of the cylinder;
	// the parameters are: 
    // radius top, radius bottom, height,
    // number of segments on the radius, 
    //number of segments vertically

    var geom = new THREE.CylinderGeometry(game.seaRadius,game.seaRadius,game.seaLength,40,10);
    
    // Rotate the geometry on the x axis
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));


    // important:
    // by merging vertives we ensure the continuity of the waves
    geom.mergeVertices();


    // get the vertices
    var l = geom.vertices.length

    // create an array to store new data associated to each vertex
    this.waves = [];


    for( var i=0; i < l; i++){
        //get each vertex
        var v = geom.vertices[i];

        // store some data associated to it
        this.waves.push({
            y:v.y,
            x:v.x,
            z:v.z,
            // a random angle
            ang:Math.random()*Math.PI*2,
            // a random distance
            amp:game.wavesMinAmp + Math.random()*(game.wavesMaxAmp-game.wavesMinAmp),
            // a random speed between 0.016 and 0.048 radians / frame
            speed:game.wavesMinSpeed + Math.random()*(game.wavesMaxSpeed - game.wavesMinSpeed)
        });
    }

    //create the material
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.red,
        transparent:true,
        opacity:.8,
        shading:THREE.FlatShading,
    });

    // To create an object in Three.js, we have to create a mesh
    // which is a combination of a geometry and some material
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.name = "waves"
    // Allow the sea to recieve shadows
    this.mesh.receiveShadow = true;

}

    // now we create the function that will be called in each fram
    // to update the position of the vertices to simulate the waves

    Sea.prototype.moveWaves = function (){
        //get the vertices
        var verts = this.mesh.geometry.vertices;
        var l = verts.length;

        for(var i = 0; i < l; i++){
            var v = verts[i];

            //get the data associated with it
            var vprops = this.waves[i];

            //update the position of the vertex
            v.x = vprops.x + Math.cos(vprops.ang)*vprops.amp;
            v.y = vprops.y + Math.sin(vprops.ang)*vprops.amp;

            //increment the angle for the next frame
            vprops.ang += vprops.speed*deltaTime;
            
        

	// Tell the renderer that the geometry of the sea has changed.
	// In fact, in order to maintain the best level of performance, 
	// three.js caches the geometries and ignores any changes
	// unless we add this line
	this.mesh.geometry.verticesNeedUpdate=true;

	//sea.mesh.rotation.z += .005;
}

    }


    // instantiate the sea and add it to the scene:

    var sea;
    function createSea(){
        sea = new Sea();

        // push it a little bit at the bottome of the scene
        sea.mesh.position.y = -game.seaRadius;

        // add the mesh of the sea to the scene
        scene.add(sea.mesh);
    }





//Cloud function

Cloud = function(){
    
    // Create an empty container that will hold different parts of the cloud
    this.mesh = new THREE.Object3D();
    this.mesh.name = "cloud"
    // Create a cube geometry;
    // this shape will be duplicated to create a cloud
    var geom = new THREE.BoxGeometry(20,20,20);

    // Create a material; a simple white material will do the trick
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.white,
    });

    //duplicate the geometry a random number of times
    var nBlocs = 3+Math.floor(Math.random()*3);

    for(var i=0; i<nBlocs; i++){

        // create the mesh by cloning the geometry
        var m = new THREE.Mesh(geom, mat);

        //set the position and the rotation of each cube randomly
        m.position.x = i*15;
        m.position.y = Math.random()*10;
        m.position.z = Math.random()*10;
        m.rotation.z = Math.random()*Math.PI*2;
        m.rotation.y = Math.random()*Math.PI*2;

        //set the size of the cuybe randomnly
        var s = .1 + Math.random()*.9;
        m.scale.set(s,s,s);
        //allow each cube to cast and to recieve shadows.
        m.castShadow = true;
        m.receiveShadow = true;

        // add the cube to the container we first created
        this.mesh.add(m);

    }

}
Cloud.prototype.rotate = function(){
    var l = this.mesh.children.length;
    console.log(l)
    for(var i=0; i<l; i++){
      var m = this.mesh.children[i];
      m.rotation.z+= Math.random()*(i+1);
      m.rotation.y+= Math.random()*.002*(i+1);
    }
  }

// SKY OBJECT

Sky = function(){

    //create an empty container
    this.mesh = new THREE.Object3D();

    // choose a number of clouds to be scattered in teh sky
    this.nClouds = 20;

    this.clouds = []

    // to distribute the clouds consistently
    // we need to place them according to a uniform angle
    var stepAngle = Math.PI*2 / this.nClouds;


    //create cloud
    for(var i=0; i < this.nClouds; i++){
        var c = new Cloud();
        this.clouds.push(c)

        // set the rotation and the position of each cloud
        // for that we use a bit of trig

        var a = stepAngle*i; // this is the final angle of the cloud 
        // this is the distance between the center of the axis and the cloud itself
        var h = game.seaRadius + 150 + Math.random()*200;

        //simply, we are trying:
        // converting polar coordinates (angle, distance) into
        // cartesian coordinates (x , y)
        c.mesh.position.y = Math.sin(a)*h;
        c.mesh.position.x = Math.cos(a)*h;

        //rotate the cloud according to the position
        c.mesh.rotation.z = a + Math.PI/2;

        //for a better result, we position the clouds 
        // at random depths inside of the scene
        c.mesh.position.z = -400-Math.random()*500;

        // we also set a random scale for each cloud
        var s = 1+Math.random()*2;
        c.mesh.scale.set(s,s,s);

        // do not forget to add the mesh of each cloud in the scene!!!
        this.mesh.add(c.mesh);

    }

}
Sky.prototype.moveClouds = function(){
    for(var i=0; i<this.nClouds; i++){
      var c = this.clouds[i];
      
    }
    this.mesh.rotation.z += game.speed*deltaTime;
  
  }

// now we instantiate the sky and push its center a bit
// towards teh bottom of the screen

var sky;

function createSky(){
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);
}




Particle = function(){
    var geom = new THREE.TetrahedronGeometry(3,0);
    var mat = new THREE.MeshPhongMaterial({
      color:0x008999,
      shininess:10,
      specular:0xffffff,
      shading:THREE.FlatShading
    });
    this.mesh = new THREE.Mesh(geom,mat);
  }

  Particle.prototype.explode = function(pos, color, scale) {
      var _this = this;
      var _p = this.mesh.parent;
      this.mesh.material.color = new THREE.Color( color);
      this.mesh.material.needsUpdate = true;
      this.mesh.scale.set(scale,scale,scale);
      var targetX = pos.x + (-1 + Math.random()*2)*50;
      var targetY = pos.y + (-1 + Math.random()*2)*50;
      var speed = .6+Math.random()*.2;
      TweenMax.to(this.mesh.rotation, speed, {x:Math.random()*12, y:Math.random()*12});
      TweenMax.to(this.mesh.scale, speed, {x:.1, y:.1, z:.1});
      TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, delay:Math.random() *.1, ease:Power2.easeOut, onComplete:function(){
          if(_p) _p.remove(_this.mesh);
          _this.mesh.scale.set(1,1,1);
          particlesPool.unshift(_this);
        }});

  }


  ParticlesHolder = function() {
    this.mesh = new THREE.Object3D();
    this.particlesInUse = [];
}

  ParticlesHolder.prototype.spawnParticles = function(pos, density, color, scale){

    var nParticles = density;
    for (var i=0; i<nParticles; i++){
      var particle;
      if (particlesPool.length) {
        particle = particlesPool.pop();
      }else{
        particle = new Particle();
      }
      this.mesh.add(particle.mesh);
      particle.mesh.visible = true;
      var _this = this;
      particle.mesh.position.y = pos.y;
      particle.mesh.position.x = pos.x;
      particle.explode(pos,color, scale);
    }
  }


Coin = function() {
    var geom = new THREE.BoxGeometry(5,5,4,5);
    var mat = new THREE.MeshPhongMaterial({
        color: 0x009999,
        shininess:0,
        specular:0xffffff,
        
        shading: THREE.FlatShading
    });
    
    this.mesh = new THREE.Mesh(geom,mat);
    this.mesh.castShadow= true;
    this.angle = 0;
    this.dist = 0;
}

CoinsHolder = function (nCoins) {
    this.mesh = new THREE.Object3D();
    this.coinsInUse = [];
    this.coinsPool = [];

    for(var i=0; i<nCoins; i++){
        var coin = new Coin();
        this.coinsPool.push(coin);
    }
}
CoinsHolder.prototype.spawnCoins = function(){

    var nCoins = 1 + Math.floor(Math.random()*10);
    var d = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
    var amplitude = 10 + Math.round(Math.random()*10);
    for (var i=0; i<nCoins; i++){
      var coin;
      if (this.coinsPool.length) {
        coin = this.coinsPool.pop();
      }else{
        coin = new Coin();
      }
      this.mesh.add(coin.mesh);
      this.coinsInUse.push(coin);
      coin.angle = - (i*0.02);
      coin.distance = d + Math.cos(i*.5)*amplitude;
      coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
      coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
    }
  }

CoinsHolder.prototype.rotateCoins = function(){
    for (var i=0; i<this.coinsInUse.length; i++){
      var coin = this.coinsInUse[i];
      if (coin.exploding) continue;
      coin.angle += game.speed*deltaTime*game.coinsSpeed;
      if (coin.angle>Math.PI*2) coin.angle -= Math.PI*2;
      coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
      coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
      coin.mesh.rotation.z += Math.random()*.1;
      coin.mesh.rotation.y += Math.random()*.1;
  
      //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
      var diffPos = airplane.mesh.position.clone().sub(coin.mesh.position.clone());
      var d = diffPos.length();
      if (d<game.coinDistanceTolerance){
        this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
        this.mesh.remove(coin.mesh);
        particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0x009999, .8);
        addEnergy();
        i--;
      }else if (coin.angle > Math.PI){
        this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
        this.mesh.remove(coin.mesh);
        i--;
      }
    }
  }

  Ennemy = function () {
      var geom = new THREE.TetrahedronGeometry(8,2)
      var mat = new THREE.MeshPhongMaterial({
          color: Colors.red,
          shininess: 0,
          specular:0xffffff,
          shading: THREE.flatShading
      })
      this.mesh = new THREE.Mesh(geom,mat);
      this.mesh.castShadow = true;
      this.angle = 0;
      this.dist = 0;
  }

  EnnemiesHolder = function() {
      this.mesh = new THREE.Object3D()
      this.ennemiesInUse = [];
  }
  EnnemiesHolder.prototype.spawnEnnemies = function(){
    var nEnnemies = game.level;
  
    for (var i=0; i<nEnnemies; i++){
      var ennemy;
      if (ennemiesPool.length) {
        ennemy = ennemiesPool.pop();
      }else{
        ennemy = new Ennemy();
      }
  
      ennemy.angle = - (i*0.1);
      ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
      ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
      ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
  
      this.mesh.add(ennemy.mesh);
      this.ennemiesInUse.push(ennemy);
    }
  }

  EnnemiesHolder.prototype.rotateEnnemies = function(){
    for (var i=0; i<this.ennemiesInUse.length; i++){
      var ennemy = this.ennemiesInUse[i];
      ennemy.angle += game.speed*deltaTime*game.ennemiesSpeed;
  
      if (ennemy.angle > Math.PI*2) ennemy.angle -= Math.PI*2;
  
      ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
      ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
      ennemy.mesh.rotation.z += Math.random()*.1;
      ennemy.mesh.rotation.y += Math.random()*.1;
  
      //var globalEnnemyPosition =  ennemy.mesh.localToWorld(new THREE.Vector3());
      var diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
      var d = diffPos.length();
      if (d<game.ennemyDistanceTolerance){
        particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.red, 3);
  
        ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
        this.mesh.remove(ennemy.mesh);
        game.planeCollisionSpeedX = 100 * diffPos.x / d;
        game.planeCollisionSpeedY = 100 * diffPos.y / d;
        ambientLight.intensity = 4;
  
        removeEnergy();
        i--;
      }else if (ennemy.angle > Math.PI){
        ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
        this.mesh.remove(ennemy.mesh);
        i--;
      }
    }
  }


  function createCoins() {
  

      coinsHolder = new CoinsHolder(20);
      scene.add(coinsHolder.mesh);
  }

  function createEnnemies(){
    for (var i=0; i<10; i++){
      var ennemy = new Ennemy();
      ennemiesPool.push(ennemy);
    }
    ennemiesHolder = new EnnemiesHolder();
    //ennemiesHolder.mesh.position.y = -game.seaRadius;
    scene.add(ennemiesHolder.mesh)
  }

  function createParticles() {

      for(var i=0;i<10;i++){
          var particle = new Particle();
          particlesPool.push(particle);
      }
      particlesHolder = new ParticlesHolder();
      scene.add(particlesHolder.mesh);
  }


// PILOT 

var Pilot = function() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "pilot";
    this.angleHairs = 0;

    var bodyGeom = new THREE.BoxGeometry(15,15,15);
    var bodyMat = new THREE.MeshPhongMaterial({color:Colors.pink, shading:THREE.FlatShading});
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(2,-12,0);
    
    this.mesh.add(body);


    var faceGeom = new THREE.BoxGeometry(10,10,10);
    var faceMat = new THREE.MeshPhongMaterial({color:Colors.white, shading:THREE.FlatShading});
    var face = new THREE.Mesh(faceGeom, faceMat);
    
    this.mesh.add(face);

    var hairGeom = new THREE.BoxGeometry(4,4,4);
    var hairMat = new THREE.MeshPhongMaterial({color: 'yellow', shading:THREE.FlatShading});
    var hair = new THREE.Mesh(hairGeom, hairMat);
    hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
    var hairs = new THREE.Object3D();


    this.hairsTop = new THREE.Object3D();

        for(var i = 0; i < 12; i++){
            var h = hair.clone();
            var col = i%3;
            var row = Math.floor(i/3);
            var startPosZ = -4;
            var startPosX = -4;
            h.position.set(startPosX + row*4, 0, startPosZ + col*4);
            h.geometry.applyMatrix(new THREE.Matrix4().makeScale(1,1,1));
            this.hairsTop.add(h);
        }
    hairs.add(this.hairsTop);

    var hairSideGeom = new THREE.BoxGeometry(12,4,2);
    hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6,0,0));
    var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
    var hairSideL = hairSideR.clone();
    hairSideR.position.set(8,-2,6);
    hairSideL.position.set(8,-2,-6);
    hairs.add(hairSideR);
    hairs.add(hairSideL);
  
    var hairBackGeom = new THREE.BoxGeometry(2,8,10);
    var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
    hairBack.position.set(-1,-4,0)
    hairs.add(hairBack);
    hairs.position.set(-5,5,0);

    this.mesh.add(hairs);

    var glassGeom = new THREE.BoxGeometry(5,5,5);
    var glassMat = new THREE.MeshPhongMaterial({color:Colors.red});
    var glassR= new THREE.Mesh(glassGeom,glassMat);
    glassR.position.set(6,0,3);
    var glassL = glassR.clone();
    glassL.position.z = -glassR.position.z;

    var glassAGeom = new THREE.BoxGeometry(11,1,11);
    var glassA = new THREE.Mesh(glassAGeom, glassMat);
    this.mesh.add(glassR);
    this.mesh.add(glassL);
    this.mesh.add(glassA);

    var earGeom = new THREE.BoxGeometry(2,3,2);
    var earL = new THREE.Mesh(earGeom,faceMat);
    earL.position.set(0,0,-6);
    var earR = earL.clone();
    earR.position.set(0,0,6);
    this.mesh.add(earL);
    this.mesh.add(earR);

}


Pilot.prototype.updateHairs = function() {
    var hairs = this.hairsTop.children;

    var l = hairs.length;
    for(var i = 0; i < l; i++){
        var h = hairs[i];
        h.scale.y = .75 + Math.cos(this.angleHairs+i/3)*.25;
    }
    this.angleHairs += game.speed*deltaTime*40;
}


// AIRPLANE OBJECT 

var AirPlane = function() {

    this.mesh = new THREE.Object3D();
    
    //Create the cabin
    var geomCockpit = new THREE.BoxGeometry(80,50,50,1,1,1);
    var matCockpit = new THREE.MeshPhongMaterial({
        color:Colors.red,
        shading: THREE.FlatShading
    });

    // We can access a specified vertex of a shape through
    // the vertives array and then move its x,y, and z property
    geomCockpit.vertices[4].y-=10;
    geomCockpit.vertices[4].z+=20;
    geomCockpit.vertices[5].y-=10;
    geomCockpit.vertices[5].z-=20;
    geomCockpit.vertices[6].y+=30;
    geomCockpit.vertices[6].z+=20;
    geomCockpit.vertices[7].y+=30;
    geomCockpit.vertices[7].z-=20;

    var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);


    //create the engine
    var geomEngine = new THREE.BoxGeometry(20,50,50,1,1,1);
    var matEngine = new THREE.MeshPhongMaterial({
        color: Colors.white,
        shading: THREE.FlatShading
    });
    var engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    //create the tail
    var geomTail = new THREE.BoxGeometry(15,20,5,1,1,1);
    var matTail = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading
    });
    
  

    var tail = new THREE.Mesh(geomTail,matTail);
    tail.position.set(-35,25,0)
    tail.castShadow = true;
    tail.receiveShadow = true;
    this.mesh.add(tail);


    // create the wing
    var geomSideWing = new THREE.BoxGeometry(40,8,150,1,1,1);
    var matSideWing = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });

   


    var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    this.mesh.add(sideWing);


    //create the propeller
    var geomPropeller = new THREE.BoxGeometry(20,10,10,1,1,1);
    var matPropeller = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading
    });
    geomPropeller.vertices[4].y-=5;
    geomPropeller.vertices[4].z+=5;
    geomPropeller.vertices[5].y-=5;
    geomPropeller.vertices[5].z-=5;
    geomPropeller.vertices[6].y+=5;
    geomPropeller.vertices[6].z+=5;
    geomPropeller.vertices[7].y+=5;
    geomPropeller.vertices[7].z-=5;
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;
    
    // create blades
    var geomBlade = new THREE.BoxGeometry(1,100,20,1,1,1);
    var matBlade = new THREE.MeshPhongMaterial({
        color: Colors.brownDark,
        shading: THREE.FlatShading
    });

    var blade = new THREE.Mesh(geomBlade, matBlade);
    blade.position.set(8,0,0);
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.propeller.add(blade);
    this.propeller.position.set(50,0,0);
    this.mesh.add(this.propeller);
    




    this.pilot = new Pilot();
    this.pilot.mesh.position.set(-10,27,0);
    this.mesh.add(this.pilot.mesh);
};

// instantiate the airplane and add it to our scene

var airplane;

function createPlane(){
    airplane = new AirPlane();
    airplane.mesh.scale.set(.25,.25,.25);
    airplane.mesh.position.y = 100;
    scene.add(airplane.mesh);
}


function loop(){
    
  newTime = new Date().getTime();
  deltaTime = newTime-oldTime;
  oldTime = newTime;

  if (game.status=="playing"){

    // Add energy coins every 100m;
    if (Math.floor(game.distance)%game.distanceForCoinsSpawn == 0 && Math.floor(game.distance) > game.coinLastSpawn){
      game.coinLastSpawn = Math.floor(game.distance);
      console.log("I should spawn energy")
      coinsHolder.spawnCoins();
    }

    if (Math.floor(game.distance)%game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate){
      game.speedLastUpdate = Math.floor(game.distance);
      game.targetBaseSpeed += game.incrementSpeedByTime*deltaTime;
    }


    if (Math.floor(game.distance)%game.distanceForEnnemiesSpawn == 0 && Math.floor(game.distance) > game.ennemyLastSpawn){
      console.log("I should spawn enemies")
        game.ennemyLastSpawn = Math.floor(game.distance);
      ennemiesHolder.spawnEnnemies();
    }

    if (Math.floor(game.distance)%game.distanceForLevelUpdate == 0 && Math.floor(game.distance) > game.levelLastUpdate){
      game.levelLastUpdate = Math.floor(game.distance);
      game.level++;
      fieldLevel.innerHTML = Math.floor(game.level);

      game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel*game.level
    }


    updatePlane();
    updateDistance();
    updateEnergy();
    game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
    game.speed = game.baseSpeed * game.planeSpeed;

  }else if(game.status=="gameover"){
    game.speed *= .99;
    airplane.mesh.rotation.z += (-Math.PI/2 - airplane.mesh.rotation.z)*.0002*deltaTime;
    airplane.mesh.rotation.x += 0.0003*deltaTime;
    game.planeFallSpeed *= 1.05;
    airplane.mesh.position.y -= game.planeFallSpeed*deltaTime;

    if (airplane.mesh.position.y <-200){
      showReplay();
      game.status = "waitingReplay";

    }
  }else if (game.status=="waitingReplay"){

  }


  airplane.propeller.rotation.x +=.2 + game.planeSpeed * deltaTime*.005;
  sea.mesh.rotation.z += game.speed*deltaTime;//*game.seaRotationSpeed;

  if ( sea.mesh.rotation.z > 2*Math.PI)  sea.mesh.rotation.z -= 2*Math.PI;

  ambientLight.intensity += (.5 - ambientLight.intensity)*deltaTime*0.005;

  coinsHolder.rotateCoins();
  ennemiesHolder.rotateEnnemies();

  sky.moveClouds();
  sea.moveWaves();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function updatePlane(){

    game.planeSpeed = normalize(mousePos.x,-.5,.5,game.planeMinSpeed, game.planeMaxSpeed);
    var targetY = normalize(mousePos.y,-.75,.75,game.planeDefaultHeight-game.planeAmpHeight, game.planeDefaultHeight+game.planeAmpHeight);
    var targetX = normalize(mousePos.x,-1,1,-game.planeAmpWidth*.7, -game.planeAmpWidth);
  
    game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
    targetX += game.planeCollisionDisplacementX;
  
  
    game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
    targetY += game.planeCollisionDisplacementY;
  
    airplane.mesh.position.y += (targetY-airplane.mesh.position.y)*deltaTime*game.planeMoveSensivity;
    airplane.mesh.position.x += (targetX-airplane.mesh.position.x)*deltaTime*game.planeMoveSensivity;
  
    airplane.mesh.rotation.z = (targetY-airplane.mesh.position.y)*deltaTime*game.planeRotXSensivity;
    airplane.mesh.rotation.x = (airplane.mesh.position.y-targetY)*deltaTime*game.planeRotZSensivity;
    
    
    
    var targetCameraZ = normalize(game.planeSpeed, game.planeMinSpeed, game.planeMaxSpeed, game.cameraNearPos, game.cameraFarPos);
    camera.fov = normalize(mousePos.x,-1,1,40, 80);
    camera.updateProjectionMatrix ()
    camera.position.y += (airplane.mesh.position.y - camera.position.y)*deltaTime*game.cameraSensivity;
  
    game.planeCollisionSpeedX += (0-game.planeCollisionSpeedX)*deltaTime * 0.03;
    game.planeCollisionDisplacementX += (0-game.planeCollisionDisplacementX)*deltaTime *0.01;
    game.planeCollisionSpeedY += (0-game.planeCollisionSpeedY)*deltaTime * 0.03;
    game.planeCollisionDisplacementY += (0-game.planeCollisionDisplacementY)*deltaTime *0.01;
  
    airplane.pilot.updateHairs();
}

function showReplay(){
    replayMessage.style.display ="block";
}

function hideReplay() {
    replayMessage.style.display ="none";
}


function normalize(v,vmin,vmax,tmin, tmax){
    
	var nv = Math.max(Math.min(v,vmax), vmin);
	var dv = vmax-vmin;
	var pc = (nv-vmin)/dv;
	var dt = tmax-tmin;
	var tv = tmin + (pc*dt);
	return tv;

}


// CREATE TITTIES

var Titties = function(){
    this.mesh = new THREE.Object3D();
    var geom = new THREE.SphereGeometry( 5, 32, 32 );
    var mat = new THREE.MeshPhongMaterial({
		color:Colors.white,  
	});
}





function updateDistance(){
    game.distance += game.speed*deltaTime*game.ratioSpeedDistance;
    fieldDistance.innerHTML = Math.floor(game.distance);
    var d = 502*(1-(game.distance%game.distanceForLevelUpdate)/game.distanceForLevelUpdate);
    levelCircle.setAttribute("stroke-dashoffset", d);
  
  }

var blinkEnergy=false;

function updateEnergy(){
  game.energy -= game.speed*deltaTime*game.ratioSpeedEnergy;
  game.energy = Math.max(0, game.energy);
  energyBar.style.right = (100-game.energy)+"%";
  energyBar.style.backgroundColor = (game.energy<50)? "#f25346" : "#68c3c0";

  if (game.energy<30){
    energyBar.style.animationName = "blinking";
  }else{
    energyBar.style.animationName = "none";
  }

  if (game.energy <1){
    game.status = "gameover";
  }
}

function addEnergy(){
  game.energy += game.coinValue;
  game.energy = Math.min(game.energy, 100);
}

function removeEnergy(){
  game.energy -= game.ennemyValue;
  game.energy = Math.max(0, game.energy);
}

 



var mousePos = {x:0, y:0};

// now handle the mousemove event

function handleMouseMove(event) {

	// here we are converting the mouse position value received 
	// to a normalized value varying between -1 and 1;
    // this is the formula for the horizontal axis:
    var tx = -1 + (event.clientX / WIDTH) * 2;

    //for the vertical axis, we need to inverse the formula
    // because the 2D y-axis goes the opposite direction of the 3D y-axis
    var ty = 1 - (event.clientY / HEIGHT) * 2;
    mousePos = {x:tx, y:ty};


}






window.addEventListener('dblclick', () =>
{
    console.log('double click')
})
window.addEventListener('dblclick', () =>
{
    if(!document.fullscreenElement)
    {
        world.requestFullscreen()
    }
    else
    {
        document.exitFullscreen()
    }
})


var fieldDistance, energyBar, replayMessage, fieldLevel, levelCircle;

function init() {

    //UI
    fieldLevel = document.getElementById("levelValue");
    fieldDistance = document.getElementById("distValue")
    energyBar = document.getElementById("energyBar")
    replayMessage = document.getElementById("replayMessage");
    levelCircle = document.getElementById("levelCircleStroke");

    resetGame();
    // set up the scene, the camera and the renderer
    createScene();


    // add the Lights
    createLights();


    // add the obejects
    createPlane();
    createSea();
    createSky();
    createCoins();
    createEnnemies();
    createParticles();

    // add the listener to check if mouse is moving
    document.addEventListener('mousemove', handleMouseMove, false);
    document.addEventListener('touchmove', handleTouchMove, false);
    document.addEventListener('mouseup', handleMouseUp, false);
    document.addEventListener('touchend', handleTouchEnd, false);

    // start a loop that will update the objects' positions
    // and render the scene on each frame

    loop();
}

window.addEventListener('load', init, false);
