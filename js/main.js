// Set up three.js global variables
var scene, camera, renderer, container, loadingManager;
// Set up avatar global variables
var bbox;
//Master Gravity
var gravity = -25;
//timeScale
var timeScale = 0.95;
// Transfer global variables
var i_share = 0, n_share = 1, i_delta = 0.0;

///////////////////////////////////////////////////////////////////////////////////////////////////////
function Spark() {
	this.lifetime = 2.5;
	this.age = 0;
	this.elasticity = 0.6;
	this.maxbounces = 4;
	this.colorSpeed = -0.04;
	this.splitCount = 1;
	this.childSparkCounter = 0;
	this.noSparkChilds=3;
	this.blurFactor = 1.2;
	this.targetDir = new THREE.Vector3(1,0,0);
	//this.targetDir = new THREE.Vector3(0,0,4);

    this.velVector = new THREE.Vector3(-3.7, 6, 0);

    this.type = 'Spark';
    this.creationTime = 0;

    this.startColor = new THREE.Color(1,0.937,0.878);
    //this.endColor = new THREE.Color(0.929,0.541,0.361);
    this.endColor = new THREE.Color(0.996,0.803,0.675);

    //this.geometry = new THREE.SphereGeometry( 0.5 , 4, 4 );
    this.geometry = new THREE.CylinderGeometry( 0.5, 0.5, 0.2, 5 );
    //this.geometry = new THREE.BoxGeometry( 0.7,0.2,1 );


    this.material = new THREE.MeshBasicMaterial( { color: "rgb(255, 239, 224)" } );
    THREE.Mesh.call( this, this.geometry, this.material );
    /*this.isGoingUp = false;
    this.isMoving = false;*/
}
	Spark.prototype = Object.create( THREE.Mesh.prototype );
	Spark.prototype.constructor = Spark;
	Spark.prototype.getMesh = function() {
    	return this;
	}
	Spark.prototype.updatePos = function(grav,delta){
		
        if(this.creationTime == 0){
            this.creationTime = Date.now();
        }
        this.age = Date.now() - this.creationTime;
        if(this.age > (this.lifetime * 1000)){
        	for(var i=0;i<this.childSparkCounter;i++){
				var childSpark = scene.getObjectByName(this.name + ":" + i);
				//console.log(childSpark.name);
				scene.remove(childSpark);
			}
            scene.remove(this);
            return;
        }

        //color change
        var cr = this.material.color.r + (this.startColor.r-this.endColor.r)*this.colorSpeed;
        var cg = this.material.color.g + (this.startColor.g-this.endColor.g)*this.colorSpeed;
        var cb = this.material.color.b + (this.startColor.b-this.endColor.b)*this.colorSpeed;

        this.material.color = new THREE.Color(cr,cg,cb);

        //set velocity
		this.velVector.x = this.velVector.x - (0.01*this.targetDir.x);		
		this.velVector.y = this.velVector.y + (0.5*grav*delta);
		this.velVector.z = this.velVector.z + (0.01*this.targetDir.z);

		var p=this.position;
		this.position.set(p.x + this.velVector.x * delta,
			p.y + this.velVector.y*delta,
			p.z + this.velVector.z*delta);
		for(var i=0;i<this.childSparkCounter;i++){
			var childSpark = scene.getObjectByName(this.name + ":" + i);
			childSpark.updatePos(grav,delta);
			childSpark.checkRayCol();
		}
	}
	Spark.prototype.checkRayCol = function(){
		
		var l=this.velVector.length() ;

		var normalizedVel= new THREE.Vector3( this.velVector.x/l, this.velVector.y/l, this.velVector.z/l);
		var rayOrigin=this.position; //+ new THREE.Vector3(0,-0.01,0); //new THREE.Vector3(0,1,0);
		var rayDir=normalizedVel;
		this.scale.set(0.015, 0.07, 0.013 * l * this.blurFactor);

		var pos = new THREE.Vector3();
		pos.addVectors(rayDir, this.position);
		this.lookAt(pos);
		
	    var raycaster = new THREE.Raycaster(rayOrigin,rayDir);
	    raycaster.far=0.2;

		scene.updateMatrixWorld();

		var intersects = raycaster.intersectObjects(scene.children,true);
		if(intersects[0]){
			this.onCollision(intersects[0].face.normal,intersects[0].point);
		}
		scene.remove(this.raycaster);
	}
	Spark.prototype.onCollision = function(collNor,collpoint){
		if(this.maxbounces-- < 0){
			//scene.remove(this);
			//this.material.color = new THREE.Color(0,0,0);
			this.visible = false;
			//console.log("Done");
			return;
		}
		var mulConst=-2 * this.velVector.dot(collNor);
		var dotPart = collNor.multiplyScalar(mulConst);
		var addPart = dotPart.add(this.velVector);
		//this.velVector = new THREE.Vector3(this.velVector.x, this.velVector.y * this.elasticity,this.velVector.z);
		this.velVector = addPart;
		this.velVector = new THREE.Vector3(this.velVector.x * this.elasticity, this.velVector.y * this.elasticity,this.velVector.z * this.elasticity);
		//this.velVector = new THREE.Vector3(this.velVector.x, this.velVector.y ,this.velVector.z);
		
		if(this.splitCount>0){
			var angle=0;
			this.splitCount--;
			var n=this.noSparkChilds;
			while(n-- > 0)
			{
    			var childSpark = new Spark();
            	childSpark.name = this.name + ":" +  this.childSparkCounter++;
            	childSpark.isMoving = true;
            	childSpark.position.set(collpoint.x,collpoint.y,collpoint.z);
            	childSpark.scale.set(0.03,0.03,0.03);
            	childSpark.splitCount = 0;
            	childSpark.blurFactor = 0.7;
            	childSpark.colorSpeed = -0.05;
            	//childSpark.elasticity = 0.1;
            	childSpark.material.color = new THREE.Color(this.material.color.r,this.material.color.g,this.material.color.b);
            	//childSpark.lifetime = 0.5;
            	childSpark.targetDir=new THREE.Vector3(0,0,0);
            	
				angle += Math.PI/this.noSparkChilds;
				childSpark.velVector.applyAxisAngle( collNor.normalize(), angle );
				childSpark.velVector.set(childSpark.velVector.x * 0.6,
					childSpark.velVector.y * 0.6,
					childSpark.velVector.z * 0.6);
            	//childSpark.velVector.set(-this.velVector.x,this.velVector.y,this.velVector.z);

            	childSpark.velVector.x += (2*Math.random() - 1);
            	childSpark.velVector.y += (2*Math.random() - 1);
            	childSpark.velVector.z += (2*Math.random() - 1);
            
            	scene.add(childSpark);
        	}
		}
		//scene.remove(this);

	}
///////////////////////////////////////////////////////////////////////////////////////////////////////
function SparkGenerator() {
	this.spread = new THREE.Vector3(1.5,0.2,1.8);
	//this.spread = new THREE.Vector3(0.3,0.3,0.3);
	this.rate = 1;
    this.type = 'SparkGenerator';
    this.sparkCounter = 0;
    this.minID = 0;

    this.geometry = new THREE.SphereGeometry(0 , 0, 0);
    this.material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
    THREE.Mesh.call( this, this.geometry, this.material);

    this.generateSpark = function() {

            var newSpark = new Spark();
            newSpark.name = this.name+this.sparkCounter++;
            newSpark.isMoving = true;
            //console.log(newSpark.name);
            newSpark.velVector.x += this.spread.x * (2*Math.random() - 1);
            newSpark.velVector.y += this.spread.y * (2*Math.random() - 1);
            newSpark.velVector.z += this.spread.z * (2*Math.random() - 1);

            scene.add(newSpark);
            
            var position = new THREE.Vector3();
            position.getPositionFromMatrix(this.matrixWorld );

            newSpark.position.set(position.x, position.y, position.z);
            //newSpark.scale.set( 0.2, 0.01, 0.01 );

            
    };
    this.sparkGenUpdater = function(delta){
    		for (var i = this.minID; i < this.sparkCounter; i++) {
                var ball = scene.getObjectByName(this.name+i);
                //console.log(ball);
                if(!ball){
                    this.minID = i;
                    continue;
                }
                ball.updatePos(gravity,delta);
                ball.checkRayCol();
            }
    }

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
    renderer.setClearColor(0x111111, 0);
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
             var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;
             renderer.setSize(WIDTH, HEIGHT);
             camera.aspect = WIDTH / HEIGHT;
             camera.updateProjectionMatrix();
        }
    );
 	
 	initlighting();
    
    // Load in the mesh and add it to the scene.
    var sawBlade_texPath = 'assets/sawblade.jpg';
    var sawBlade_objPath = 'assets/sawblade.obj';
    OBJMesh(sawBlade_objPath, sawBlade_texPath, "sawblade");

    //var ground_texPath = 'assets/ground_tile.jpg';
    var ground_texPath = 'assets/ground_tile_1.png';
    var ground_objPath = 'assets/ground1.obj';
    OBJMesh(ground_objPath, ground_texPath, "ground");
    //collMeshes.push( scene.getObjectByName("ground") );

    //var slab_texPath = 'assets/slab.jpg';
	var slab_texPath = 'assets/BakeAtlas.jpg';
    var slab_objPath = 'assets/slab1.obj';
    OBJMesh(slab_objPath, slab_texPath, "slab");
    //collMeshes.push( scene.getObjectByName("slab") );
    
     //Stanford Bunny
    //var bunny_texPath = 'assets/rocky.jpg';
    var bunny_texPath = 'assets/BakeAtlas.jpg';
    var bunny_objPath = 'assets/stanford_bunny1.obj';
    OBJMesh(bunny_objPath, bunny_texPath, "bunny");
    //collMeshes.push( scene.getObjectByName("bunny") );
    
    /*var spark_objPath = 'assets/spark.obj';
    OBJMesh(spark_objPath, "", "spark");*/

    //Sphere
    //var sphere_texPath = 'assets/rocky.jpg';
    var sphere_texPath = 'assets/BakeAtlas.jpg';
    var sphere_objPath = 'assets/sphere1.obj';
    OBJMesh(sphere_objPath, sphere_texPath, "sphere");

    // Generator
    var gen1 = new SparkGenerator();
    gen1.name = 'generator1';
    gen1.position.set(-0.4, 1.15, 0);
    gen1.scale.set( 0, 0, 0 );
    scene.add(gen1);

    /*var gen2 = new SparkGenerator();
    gen2.name = 'generator2';
    gen2.position.set(-0.4, 1.17, 0);
    gen2.scale.set( 0, 0, 0 );
    gen2.rate=0.6;
    gen2.spread = new THREE.Vector3(1,1,3);
    scene.add(gen2);*/

     //Cube
    //var cube_texPath = 'assets/rocky.jpg';
    var cube_texPath = 'assets/BakeAtlas.jpg';
    var cube_objPath = 'assets/cube1.obj';
    OBJMesh(cube_objPath, cube_texPath, "cube");
    
    //Cone
    //var cone_texPath = 'assets/rocky.jpg';
    var cone_texPath = 'assets/BakeAtlas.jpg';
    var cone_objPath = 'assets/cone1.obj';
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
    delta*=timeScale;

    translate(asset, 0,-1.5,0);
    rotate(asset, new THREE.Vector3(0,0,1), -9* delta); //rotate sawblade
    translate(asset, 0,1.5,0);       
    
    var gen1 = scene.getObjectByName("generator1");

    if(Math.random()>(1-gen1.rate)){
    	gen1.generateSpark();
	}

	gen1.sparkGenUpdater(delta);

   	/*var gen2 = scene.getObjectByName("generator2");
    if(Math.random()>(1-gen2.rate)){
    	gen2.generateSpark();
	}

	gen2.sparkGenUpdater(delta);*/

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
                    	//child.material = new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.FlatShading } );
                    	if(objName!="sawblade"){
                    		child.material = new THREE.MeshBasicMaterial( { color: 0xffffff, shading: THREE.SmoothShading } );
                        	
                    	}else{
                    		child.material = new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.SmoothShading } );
                    	}
                    	child.material.map = texture;
                        child.material.needsUpdate = true;
                        //sceneObjects.push(child.object );
                    }
    				//child.material=new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.SmoothShading } );
                }
            );

            object.name = objName;
            
            /*if(objName=="sawblade")
            {
            	object.material=new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.SmoothShading } );
            	console.log(object.name);
            	object.castShadow=true;
            	object.recieveShadow=true;
            }*/

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
    //var text = document.getElementById("info");
    text.innerHTML = textStr;
    text.style.left = x + 'px';
    text.style.top  = y + 'px';
}

function putTextExt(dividstr, textStr) //does not need init
{
    var text = document.getElementById(dividstr);
    text.innerHTML = textStr;
}

function initlighting(){
	// Create a light, set its position, and add it to the scene.
    var alight = new THREE.AmbientLight(0x111111);
    alight.position.set(-100.0, 200.0, 100.0);
    scene.add(alight);

    var directionalLight = new THREE.DirectionalLight( 0xffeedd,0.7 );
                directionalLight.position.set( 0, 5, 0 );
                directionalLight.castShadow = true;
                scene.add( directionalLight );
    var light1 = new THREE.PointLight( 0xA24444, 0.6, 1000 );
	light1.position.set( 5, 3, -0.3 );
	scene.add( light1 );

	var light2 = new THREE.PointLight( 0x4444A2, 0.25, 500 );
	light2.position.set( -5, 0, 5 );
	scene.add( light2 );
	// white spotlight shining from the side, casting shadow

	var spotLight = new THREE.SpotLight( 0xffffff,0.5 );
	spotLight.position.set( 3, 3, 3 );

	//spotLight.castShadow = true;

	spotLight.shadow.mapSize.width = 1024;
	spotLight.shadow.mapSize.height = 1024;

	spotLight.shadow.camera.near = 500;
	spotLight.shadow.camera.far = 4000;
	spotLight.shadow.camera.fov = 40;

	scene.add( spotLight );
}