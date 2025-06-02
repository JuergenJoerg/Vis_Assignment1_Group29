class CuttingPlane {
    xRot = 0.0;
    yRot = 0.0;
    translation = new THREE.Vector3(0.0, 0.0, 0.0);
    renderAbovePlane = false;

    constructor() {
        this.xRotSlider = d3.select("#xRotSlider");
        this.yRotSlider = d3.select("#yRotSlider");
        this.xTranSlider = d3.select("#xTranSlider");
        this.yTranSlider = d3.select("#yTranSlider");
        this.zTranSlider = d3.select("#zTranSlider");
        this.renderSideSelect = d3.select("#cpRenderSideSelect");

        this.xRotSlider.on("input", (event)=> {
            this.xRot = event.target.value;
            this.update();
        });

        this.yRotSlider.on("input", (event)=> {
            this.yRot = event.target.value;
            this.update();
        });

        this.xTranSlider.on("input", (event)=> {
            this.translation.x = event.target.value;
            this.update();
        });

        this.yTranSlider.on("input", (event)=> {
            this.translation.y = event.target.value;
            this.update();
        });

        this.zTranSlider.on("input", (event)=> {
            this.translation.z = event.target.value;
            this.update();
        });

        this.renderSideSelect.on("change", (event)=> {
            this.renderAbovePlane = (event.target.value == 1);
            this.update();
        })
    }

    update() {
        if (this.shader === undefined) {
            return;
        }

        // Set Rotation Uniforms
        this.shader.setUniform("planeRotX", this.xRot * (Math.PI / 180));
        this.shader.setUniform("planeRotY", this.yRot * (Math.PI / 180));

        // Set Translation Uniform
        this.shader.setUniform("planePos", this.translation);

        // Set Render Side Uniform
        this.shader.setUniform("renderAbovePlane", this.renderAbovePlane);

        paint();
    }

    setShader(shader) {
        this.shader = shader;
    }
}