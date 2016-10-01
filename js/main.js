// Set up three.js global variables
var scene, camera, renderer, container, loadingManager;
// Set up avatar global variables
var bbox;
//Master Gravity
var gravity = -20;
// Transfer global variables
var i_share = 0, n_share = 1, i_delta = 0.0;

///////////////////////////////////////////////////////////////////////////////////////////////////////
// class for spark object - preliminary , needs a lot of changes
function Spark() {
	this.elasticity = 0.8;
	this.maxbounces = 4;
    this.velVector = new THREE.Vector3(0, 0, 0);
    this.type = 'Spark';

    this.geometry = new THREE.SphereGeometry( 0.5 , 6, 4 );
    this.material = new THREE.MeshLambertMaterial( { color: 0xffff00 } );
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
		var particle = this.getMesh();
		this.velVector.x = this.velVector.x + 0;		
		this.velVector.y = this.velVector.y + 0.5*grav*delta;
		this.velVector.z = this.velVector.z + 0;
		//this.velVector = new THREE.Vector3 (vdx,vdy,vdz);
		//console.log(velVector.y);
		var p=particle.position;
		particle.position.set(p.x + this.velVector.x * delta,
			p.y + this.velVector.y*delta,
			p.z + this.velVector.x*delta);
	}
	Spark.prototype.onCollision = function(collDir){
		this.velVector.y *= -this.elasticity;
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
    

    //Sphere
    var sphere_texPath = 'assets/rocky.jpg';
    var sphere_objPath = 'assets/sphere.obj';
    OBJMesh(sphere_objPath, sphere_texPath, "sphere");


    //Ball
    var ball = new Spark();
    ball.name = 'ball';
    ball.isMoving = true;
    scene.add(ball);
    
    ball.position.set(-2, 10, 2);
    ball.scale.set( 0.3, 0.3, 0.3 );


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
    /*var ball = scene.getObjectByName("ball");
    
    var position = new THREE.Vector3();
    position.getPositionFromMatrix( ball.matrixWorld );
    
    console.log(position.y);*/


    // can be simplified????
    // constants are more or less arbitrary. need to fix that.
    /*if(ball.isMoving){
        if(position.y > 0 && ball.isGoingUp == false){
            ball.velVector[1] -= 0.005;
        }
        if(position.y <= 0.5 && ball.isGoingUp == false){
            ball.velVector[1] = -ball.velVector[1]*0.75;

            if(ball.velVector[1] < 0.05)
                ball.isMoving = false;

            ball.isGoingUp = true;
        }
        if(position.y > 0 && ball.isGoingUp == true){
            ball.velVector[1] -= 0.005;
            if(ball.velVector[1] <= 0)
                ball.isGoingUp = false;
        }
    }
    else{
        ball.velVector[1] = 0;
    }*/

    //gravity for now
    //ball.position.set(position.x, position.y + ball.velVector[1], position.z);
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

    var ball = scene.getObjectByName("ball");
    ball.updatePos(gravity,delta);
    if(ball.position.y<=0 && ball.maxbounces-- >=0){
    	ball.onCollision(new THREE.Vector3(0,1,0));
    	console.log("bounced!");
    	//break;
    }
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