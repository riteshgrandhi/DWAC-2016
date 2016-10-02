// Set up three.js global variables
var scene, camera, renderer, container, loadingManager;
// Set up avatar global variables
var bbox;
//Master Gravity
var gravity = -25;
// Transfer global variables
var i_share = 0, n_share = 1, i_delta = 0.0;

///////////////////////////////////////////////////////////////////////////////////////////////////////
// class for spark object - preliminary , needs a lot of changes
function Spark() {
	this.elasticity = 1;
	this.maxbounces = 4;
    this.velVector = new THREE.Vector3(-2, 8, 0);
    this.type = 'Spark';
    this.creationTime = 0;

    this.geometry = new THREE.SphereGeometry( 0.5 , 6, 4 );
    this.material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    //this.mesh = new THREE.Mesh(geometry,material);
    THREE.Mesh.call( this, this.geometry, this.material );

    this.isGoingUp = false;
    this.isMoving = false;
}
	Spark.prototype = Object.create( THREE.Mesh.prototype );
	Spark.prototype.constructor = Spark;
	Spark.prototype.getMesh = function() {
    	return this;
	}
	Spark.prototype.updatePos = function(grav,delta){
        if(this.creationTime == 0)
            this.creationTime = Date.now();

        else if(Date.now() - this.creationTime > 10000){
            scene.remove(this);
            return;
        }

		// this.velVector.x = this.velVector.x - 0;		
		this.velVector.y = this.velVector.y + 0.5*grav*delta;
		// this.velVector.z = this.velVector.z + 0; ///?????????????????? why do we need this?

		var p=this.position;
		this.position.set(p.x + this.velVector.x * delta,
			p.y + this.velVector.y*delta,
			p.z + this.velVector.z*delta);
	}
	Spark.prototype.checkRayCol = function(){
		
		var l=this.velVector.length() ;

		var normalizedVel= new THREE.Vector3( this.velVector.x/l, this.velVector.y/l, this.velVector.z/l);
		var rayOrigin=this.position; //+ new THREE.Vector3(0,-0.01,0); //new THREE.Vector3(0,1,0);
		var rayDir=normalizedVel;
		//var rayDir=new THREE.Vector3(0,-1,0);


	    var raycaster = new THREE.Raycaster(rayOrigin,rayDir);
	    raycaster.far=0.1;

		scene.updateMatrixWorld();

		var intersects = raycaster.intersectObjects(scene.children,true);
		if(intersects[0]){
			console.log(intersects[0].face);
			//intersects[0].object.material.color=0x00FF00;
			this.onCollision(intersects[0].face.normal);
		}

		scene.remove(this.raycaster);
	}
	Spark.prototype.onCollision = function(collNor){
		//collNor.normalize();
		if(this.maxbounces-- == 0){
			// scene.remove(this);
			console.log("Done");
		}
		var mulConst=-2 * this.velVector.dot(collNor);
		var dotPart = collNor.multiplyScalar(mulConst);
		var addPart = dotPart.add(this.velVector);
		this.velVector = addPart.multiplyScalar(this.elasticity);
	}
///////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////
function SparkGenerator() {
    this.type = 'SparkGenerator';
    this.sparkCounter = 0;
    this.minID = 0;

    this.geometry = new THREE.SphereGeometry(0 , 0, 0);
    this.material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
    THREE.Mesh.call( this, this.geometry, this.material);

    this.generateSpark = function(orientation) {
            var newSpark = new Spark();
            newSpark.name = 'newSpark' + this.sparkCounter++;
            newSpark.isMoving = true;
            
            newSpark.velVector.x = orientation.x * 0.3;
            newSpark.velVector.y = orientation.y * 0.3;
            newSpark.velVector.z = orientation.z * 0.3;

            scene.add(newSpark);
            
            var position = new THREE.Vector3();
            position.getPositionFromMatrix(this.matrixWorld );

            newSpark.position.set(position.x, position.y, position.z);
            newSpark.scale.set( 0.03, 0.03, 0.03 );

            var delta = clock.getDelta();
            for (var i = this.minID; i < this.sparkCounter; i++) {
                var ball = scene.getObjectByName('newSpark' + i);
                if(!ball){
                    this.minID = i;
                    continue;
                }
                ball.updatePos(gravity,delta);
                ball.checkRayCol();
            }

            console.log(newSpark);
        // console.log(position);
        // console.log("gend spark");

    };

}
SparkGenerator.prototype = Object.create( THREE.Mesh.prototype );
SparkGenerator.prototype.constructor = SparkGenerator;
SparkGenerator.prototype.getMesh = function() {
    return this;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////

init();
animate();

// Sets up the scene.
function init()
{
	

    // Create the scene and set the scene size.
    scene = new THREE.Scene();
    scene.updateMatrixWorld(true);
    // keep a loading manager
    loadingManager = new THREE.LoadingManager();

    //projector = new THREE.Projector();
    // Get container information
    container = document.createElement( 'div' );
    document.body.appendChild( container ); 
        
    var WIDTH = window.innerWidth, HEIGHT = window.innerHeight; //in case rendering in body
    

    // Create a renderer and add it to the DOM.
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(WIDTH, HEIGHT);
    // Set the background color of the scene.
    renderer.setClearColor(0x111111, 1);
    //document.body.appendChild(renderer.domElement); //in case rendering in body
    container.appendChild( renderer.domElement );

    // Create a camera, zoom it out from the model a bit, and add it to the scene.
    camera = new THREE.PerspectiveCamera(45.0, WIDTH / HEIGHT, 0.01, 1000);
    camera.position.set(-7, 2, -10);
    camera.lookAt(new THREE.Vector3(5,0,0));
    scene.add(camera);
    renderer.shadowMap.enabled = true;

    // Create an event listener that resizes the renderer with the browser window.
    window.addEventListener('resize',
        function ()
        {
            // var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;
            // renderer.setSize(WIDTH, HEIGHT);
            // camera.aspect = WIDTH / HEIGHT;
            // camera.updateProjectionMatrix();
        }
    );
 	
 	initlighting();
    
    // Load in the mesh and add it to the scene.
    var sawBlade_texPath = 'assets/sawblade.jpg';
    var sawBlade_objPath = 'assets/sawblade.obj';
    OBJMesh(sawBlade_objPath, sawBlade_texPath, "sawblade");

    var ground_texPath = 'assets/ground_tile.jpg';
    var ground_objPath = 'assets/ground.obj';
    OBJMesh(ground_objPath, ground_texPath, "ground");

    var slab_texPath = 'assets/slab.jpg';
    var slab_objPath = 'assets/slab.obj';
    OBJMesh(slab_objPath, slab_texPath, "slab");
    
     //Stanford Bunny
    var bunny_texPath = 'assets/rocky.jpg';
    var bunny_objPath = 'assets/stanford_bunny.obj';
    OBJMesh(bunny_objPath, bunny_texPath, "bunny");
    
    //objects Array
	var sceneObjects=[scene];

    //Sphere
    var sphere_texPath = 'assets/rocky.jpg';
    var sphere_objPath = 'assets/sphere.obj';
    OBJMesh(sphere_objPath, sphere_texPath, "sphere");


    //Ball
    // var ball = new Spark();
    // ball.name = 'ball';
    // ball.isMoving = true;
    // scene.add(ball);


    // Generator
    var generator = new SparkGenerator();
    generator.name = 'generator';
    scene.add(generator);
    
    generator.position.set(2, 2, 2);
    generator.scale.set( 0, 0, 0 );


     //Cube
    var cube_texPath = 'assets/rocky.jpg';
    var cube_objPath = 'assets/cube.obj';
    OBJMesh(cube_objPath, cube_texPath, "cube");
    
    //Cone
    var cone_texPath = 'assets/rocky.jpg';
    var cone_objPath = 'assets/cone.obj';
    OBJMesh(cone_objPath, cone_texPath, "cone");
    
    
    // Add OrbitControls so that we can pan around with the mouse.
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.4;
    controls.userPanSpeed = 0.01;
    controls.userZoomSpeed = 0.01;
    controls.userRotateSpeed = 0.01;
    controls.minPolarAngle = -Math.PI/2;
    controls.maxPolarAngle = Math.PI/2;
    controls.minDistance = 0.01;
    controls.maxDistance = 30;


    clock = new THREE.Clock();
    var delta = clock.getDelta();
}


function animate()
{
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    postProcess();
    controls.update();
}

function rotate(object, axis, radians)
{
    var rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
    object.applyMatrix(rotObjectMatrix);
}
function translate(object, x, y, z)
{
    var transObjectMatrix = new THREE.Matrix4();
    transObjectMatrix.makeTranslation(x, y, z);
    object.applyMatrix(transObjectMatrix);
}


function postProcess()
{
    
    var delta = clock.getDelta();
    var asset = scene.getObjectByName( "sawblade" );

    translate(asset, 0,-1.5,0);
    rotate(asset, new THREE.Vector3(0,0,1), -9* delta); //rotate sawblade
    translate(asset, 0,1.5,0);       
    setPositions();

    // var ball = scene.getObjectByName("ball");
    // ball.updatePos(gravity,delta);
    // ball.checkRayCol();

    var gen = scene.getObjectByName("generator");
    var orientation = new THREE.Vector3(1,1,1);
    if(Math.random() > 0.5){
        gen.generateSpark(orientation);
    }
    /*if(ball.position.y<=0 && ball.maxbounces-- >=0){
    	//ball.onCollision(new THREE.Vector3(0,1,0));
    	console.log("bounced!");
    	//break;
    }*/
}


function OBJMesh(objpath, texpath, objName/*, objStartPos*/)
{
    var texture = new THREE.TextureLoader( loadingManager ).load(texpath, onLoad, onProgress, onError);
    var loader  = new THREE.OBJLoader( loadingManager ).load(objpath,  
        function ( object )
        {
            object.traverse(
                function ( child )
                {
                    if(child instanceof THREE.Mesh)
                    {
                    	child.material = new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.FlatShading } );
                        child.material.map = texture;
                        child.material.needsUpdate = true;
                        child.recieveshadow=true;
                        child.castShadow=true;
                        //sceneObjects.push(child.object );
                    }
    				//child.material=new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.SmoothShading } );
                }
            );

            object.name = objName;
            /*object.material=new THREE.MeshPhongMaterial( /*{ color: 0xffffff, shading: THREE.SmoothShading } );
            object.recieveshadow=true;*/
            if(objName=="sawblade")
            	object.material=new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.SmoothShading } );
            if(objName=="ground"){
            	object.recieveshadow=true;
            	object.castShadow=false;
            }

              // translate(object, 0,1.5,0); //move it up to slab
    
            scene.add( object );
            onLoad( object );
            
        },
    onProgress, onError);
}

function onLoad( object )
{
    putText(0, "", 0, 0);
    i_share ++;
    if(i_share >= n_share)
        i_share = 0;
}

function onProgress( xhr )
{ 
    if ( xhr.lengthComputable )
    {
        var percentComplete = 100 * ((xhr.loaded / xhr.total) + i_share) / n_share;
        putText(0, Math.round(percentComplete, 2) + '%', 10, 10);
    }
}

function onError( xhr )
{
    putText(0, "Error", 10, 10);
}


function putText( divid, textStr, x, y )
{
    var text = document.getElementById("avatar_ftxt" + divid);
    text.innerHTML = textStr;
    text.style.left = x + 'px';
    text.style.top  = y + 'px';
}

function putTextExt(dividstr, textStr) //does not need init
{
    var text = document.getElementById(dividstr);
    text.innerHTML = textStr;
}
function setPositions(){
	scene.getObjectByName("bunny").position.set(-2, 0, -1);
	scene.getObjectByName("cube").position.set(-2, -0.4, 0.05);
	scene.getObjectByName("cone").position.set(-1.5, 0, 1.4);
	scene.getObjectByName("sphere").position.set(-0.2, 0, 0.4);

	/*var con = scene.getObjectByName("cone");
    directionalLight.target.position.set(con.position.x,con.position.y,con.position.z);*/
}
function initlighting(){
	// Create a light, set its position, and add it to the scene.
    var alight = new THREE.AmbientLight(0x111111);
    alight.position.set(-100.0, 200.0, 100.0);
    scene.add(alight);

    /*var directionalLight = new THREE.DirectionalLight( 0xffeedd );
                directionalLight.position.set( 0, 5, 0 );
                directionalLight.castShadow = true;
                scene.add( directionalLight );*/
    var light1 = new THREE.PointLight( 0xA24444, 0.6, 1000 );
	light1.position.set( 1, 5, -0.3 );
	scene.add( light1 );

	var light2 = new THREE.PointLight( 0x4444A2, 0.25, 500 );
	light2.position.set( -5, 0, 5 );
	scene.add( light2 );
	// white spotlight shining from the side, casting shadow

	var spotLight = new THREE.SpotLight( 0xffffff,2 );
	spotLight.position.set( 3, 3, -3 );

	spotLight.castShadow = true;

	spotLight.shadow.mapSize.width = 1024;
	spotLight.shadow.mapSize.height = 1024;

	spotLight.shadow.camera.near = 500;
	spotLight.shadow.camera.far = 4000;
	spotLight.shadow.camera.fov = 40;

	scene.add( spotLight );
}