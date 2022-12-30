"use strict";

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.querySelector("#canvas");
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // setup GLSL program
    var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-3d", "fragment-shader-3d"]);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var colorLocation = gl.getAttribLocation(program, "a_color");

    // lookup uniforms
    var matrixLocation = gl.getUniformLocation(program, "u_matrix");

    // Create a buffer to put positions in
    var positionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Put geometry data into buffer
    setGeometry(gl);

    // Create a buffer to put colors in
    var colorBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = colorBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    // Put geometry data into buffer
    setColors(gl);

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    var translation = [327, 382, 0];
    var rotation = [degToRad(244), degToRad(17), degToRad(179)];
    var scale = [1, 1, 1];

    drawScene();

    // Setup a ui.
    webglLessonsUI.setupSlider("#x", { value: translation[0], slide: updatePosition(0), max: gl.canvas.width });
    webglLessonsUI.setupSlider("#y", { value: translation[1], slide: updatePosition(1), max: gl.canvas.height });
    webglLessonsUI.setupSlider("#z", { value: translation[2], slide: updatePosition(2), max: gl.canvas.height });
    webglLessonsUI.setupSlider("#angleX", { value: radToDeg(rotation[0]), slide: updateRotation(0), max: 360 });
    webglLessonsUI.setupSlider("#angleY", { value: radToDeg(rotation[1]), slide: updateRotation(1), max: 360 });
    webglLessonsUI.setupSlider("#angleZ", { value: radToDeg(rotation[2]), slide: updateRotation(2), max: 360 });
    webglLessonsUI.setupSlider("#scaleX", { value: scale[0], slide: updateScale(0), min: -5, max: 5, step: 0.01, precision: 2 });
    webglLessonsUI.setupSlider("#scaleY", { value: scale[1], slide: updateScale(1), min: -5, max: 5, step: 0.01, precision: 2 });
    webglLessonsUI.setupSlider("#scaleZ", { value: scale[2], slide: updateScale(2), min: -5, max: 5, step: 0.01, precision: 2 });

    function updatePosition(index) {
        return function (event, ui) {
            translation[index] = ui.value;
            drawScene();
        };
    }

    function updateRotation(index) {
        return function (event, ui) {
            var angleInDegrees = ui.value;
            var angleInRadians = angleInDegrees * Math.PI / 180;
            rotation[index] = angleInRadians;
            drawScene();
        };
    }

    function updateScale(index) {
        return function (event, ui) {
            scale[index] = ui.value;
            drawScene();
        };
    }

    // Draw the scene.
    function drawScene() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Turn on culling. By default backfacing triangles
        // will be culled.
        gl.enable(gl.CULL_FACE);

        // Enable the depth buffer
        gl.enable(gl.DEPTH_TEST);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Turn on the position attribute
        gl.enableVertexAttribArray(positionLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        gl.vertexAttribPointer(
            positionLocation, //index
            3, // 3 components per iteration (size)
            gl.FLOAT, // type element 32 bit floats
            false, // normalized -> don't normalize data
            0, // 0 = move forward size * sizeof(type) each iteration to get the next position
            0, // start at the beginning of the buffer
        );

        // Turn on the color attribute
        gl.enableVertexAttribArray(colorLocation);

        // Bind the color buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        gl.vertexAttribPointer(
            colorLocation, //index
            3, // 3 components per iteration (size)
            gl.UNSIGNED_BYTE, // type element 32 bit floats
            true, // normalize the data (convert from 0-255 to 0-1)
            0, // 0 = move forward size * sizeof(type) each iteration to get the next position
            0, // start at the beginning of the buffer
        );

        // Compute the matrices
        var matrix = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 800);
            matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
            matrix = m4.xRotate(matrix, rotation[0]);
            matrix = m4.yRotate(matrix, rotation[1]);
            matrix = m4.zRotate(matrix, rotation[2]);
            matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        // Draw the geometry.
        gl.drawArrays(gl.TRIANGLES, 0, 50*6);
    }
}

var m4 = {
    projection: function (width, height, depth) {
        // Note: This matrix flips the Y axis so 0 is at the top.
        return [
            2 / width, 0, 0, 0,
            0, -2 / height, 0, 0,
            0, 0, 2 / depth, 0,
            -1, 1, 0, 1,
        ];
    },

    multiply: function (a, b) {
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];
        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];
        return [
            b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
            b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
            b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
            b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
            b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
            b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
            b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
            b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
            b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
            b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
            b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
            b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
            b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
            b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
            b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
    },

    translation: function (tx, ty, tz) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            tx, ty, tz, 1,
        ];
    },

    xRotation: function (angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1,
        ];
    },

    yRotation: function (angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1,
        ];
    },

    zRotation: function (angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    },

    scaling: function (sx, sy, sz) {
        return [
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1,
        ];
    },

    translate: function (m, tx, ty, tz) {
        return m4.multiply(m, m4.translation(tx, ty, tz));
    },

    xRotate: function (m, angleInRadians) {
        return m4.multiply(m, m4.xRotation(angleInRadians));
    },

    yRotate: function (m, angleInRadians) {
        return m4.multiply(m, m4.yRotation(angleInRadians));
    },

    zRotate: function (m, angleInRadians) {
        return m4.multiply(m, m4.zRotation(angleInRadians));
    },

    scale: function (m, sx, sy, sz) {
        return m4.multiply(m, m4.scaling(sx, sy, sz));
    },

};

// Membentuk inisial nama
function setGeometry(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            // kiri depan
            0, 10, 0,
            0, 150, 0,
            30, 10, 0,
            0, 150, 0,
            30, 150, 0,
            30, 10, 0,

            // atas depan
            30, 10, 0,
            30, 30, 0,
            150, 10, 0,
            30, 30, 0,
            150, 30, 0,
            150, 10, 0,

            // kanan depan
            120, 10, 0,
            120, 150, 0,
            150, 10, 0,
            120, 150, 0,
            150, 150, 0,
            150, 10, 0,

            // kiri belakang
            0, 0, 20,
            30, 0, 20,
            0, 150, 20,
            0, 150, 20,
            30, 0, 20,
            30, 150, 20,

            // atas belakang
            30, 0, 20,
            150, 0, 20,
            30, 30, 20,
            30, 30, 20,
            150, 0, 20,
            150, 30, 20,

            // kanan belakang
            120, 0, 20,
            150, 0, 20,
            120, 150, 20,
            120, 150, 20,
            150, 0, 20,
            150, 150, 20,

            // atas sendiri
            0, 0, 0,
            150, 0, 0,
            150, 0, 20,
            0, 0, 0,
            150, 0, 20,
            0, 0, 20,

            // kanannya kanan
            150, 10, 0,
            150, 150, 0,
            150, 10, 20,
            150, 150, 0,
            150, 150, 20,
            150, 10, 20,

            // kirinya kiri
            0, 10, 0,
            0, 10, 20,
            0, 150, 20,
            0, 10, 0,
            0, 150, 20,
            0, 150, 0,

            // bawahnya atas sendiri
            30, 30, 0,
            30, 30, 20,
            130, 30, 20,
            30, 30, 0,
            130, 30, 20,
            130, 30, 0,

            // kanannya kiri
            30, 30, 0,
            30, 150, 0,
            30, 30, 20,
            30, 150, 0,
            30, 150, 20,
            30, 30, 20,

            // kirinya kanan
            120, 0, 0,
            120, 0, 20,
            120, 150, 20,
            120, 0, 0,
            120, 150, 20,
            120, 150, 0,

            // bawahnya kiri
            0, 150, 0,
            0, 150, 20,
            30, 150, 20,
            0, 150, 0,
            30, 150, 20,
            30, 150, 0,

            // bawahnya kanan
            120, 150, 0,
            120, 150, 20,
            150, 150, 20,
            120, 150, 0,
            150, 150, 20,
            150, 150, 0,

            // kiri depan (bagian 2)
            0, 0, 180,
            0, 150, 180,
            30, 0, 180,
            0, 150, 180,
            30, 150, 180,
            30, 0, 180,

            // atas depan (bagian 2)
            30, 0, 180,
            30, 30, 180,
            150, 0, 180,
            30, 30, 180,
            150, 30, 180,
            150, 0, 180,

            // kanan depan (bagian 2)
            120, 0, 180,
            120, 150, 180,
            150, 0, 180,
            120, 150, 180,
            150, 150, 180,
            150, 0, 180,

            // kiri belakang (bagian 2)
            0, 10, 200,
            30, 10, 200,
            0, 150, 200,
            0, 150, 200,
            30, 10, 200,
            30, 150, 200,

            // atas belakang (bagian 2)
            30, 10, 200,
            150, 10, 200,
            30, 30, 200,
            30, 30, 200,
            150, 10, 200,
            150, 30, 200,

            // kanan belakang (bagian 2)
            120, 10, 200,
            150, 10, 200,
            120, 150, 200,
            120, 150, 200,
            150, 10, 200,
            150, 150, 200,

            // atas sendiri (bagian 2)
            0, 0, 180,
            150, 0, 180,
            150, 0, 200,
            0, 0, 180,
            150, 0, 200,
            0, 0, 200,

            // kanannya kanan (bagian 2)
            150, 10, 180,
            150, 150, 180,
            150, 10, 200,
            150, 150, 180,
            150, 150, 200,
            150, 10, 200,

            // kirinya kiri (bagian 2)
            0, 10, 180,
            0, 10, 200,
            0, 150, 200,
            0, 10, 180,
            0, 150, 200,
            0, 150, 180,

            // bawahnya atas sendiri (bagian 2)
            30, 30, 180,
            30, 30, 200,
            130, 30, 200,
            30, 30, 180,
            130, 30, 200,
            130, 30, 180,

            // kanannya kiri (bagian 2)
            30, 30, 180,
            30, 150, 180,
            30, 30, 200,
            30, 150, 180,
            30, 150, 200,
            30, 30, 200,

            // kirinya kanan (bagian 2)
            120, 0, 180,
            120, 0, 200,
            120, 150, 200,
            120, 0, 180,
            120, 150, 200,
            120, 150, 180,

            // bawahnya kiri (bagian 2)
            0, 150, 180,
            0, 150, 200,
            30, 150, 200,
            0, 150, 180,
            30, 150, 200,
            30, 150, 180,

            // bawahnya kanan (bagian 2)
            120, 150, 180,
            120, 150, 200,
            150, 150, 200,
            120, 150, 180,
            150, 150, 200,
            150, 150, 180,

            // tengah banget (bagian 3)
            0, 0, 180,
            0, 0, 20,
            150, 0, 180,
            0, 0, 20,
            150, 0, 20,
            150, 0, 180,

            // kanannya tengah banget (bagian 3)
            150, 0, 0,
            150, 10, 0,
            150, 0, 200,
            150, 10, 0,
            150, 10, 200,
            150, 0, 200,

            // kirinya tengah banget (bagian 3)
            0, 0, 0,
            0, 0, 200,
            0, 10, 200,
            0, 0, 0,
            0, 10, 200,
            0, 10, 0,

            // atas depan punya tengah (bagian 3)
            0, 0, 0,
            0, 10, 0,
            150, 0, 0,
            0, 10, 0,
            150, 10, 0,
            150, 0, 0,

            // atas belakang (bagian 2)
            0, 0, 200,
            150, 0, 200,
            0, 10, 200,
            0, 10, 200,
            150, 0, 200,
            150, 10, 200,

            // bawah tengah banget (bagian 3)
            0, 10, 20,
            0, 10, 180,
            150, 10, 180,
            0, 10, 20,
            150, 10, 180,
            150, 10, 20,

        ]),
        gl.STATIC_DRAW);
}
// Fill the buffer with colors for the 'MF'.
function setColors(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Uint8Array([
            // kiri depan
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,

            // atas depan
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,

            // kanan depan
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,

            // kiri belakang
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,

            // atas belakang
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,

            // kanan belakang
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,

            // atas sendiri
            70, 150, 210,
            70, 150, 210,
            70, 150, 210,
            70, 150, 210,
            70, 150, 210,
            70, 150, 210,

            // kanannya kanan
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,

            // kirinya kiri
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,

            // bawahnya atas sendiri
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,

            // kanannya kiri
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,

            // kirinya kanan
            120, 210, 100,
            120, 210, 100,
            120, 210, 100,
            120, 210, 100,
            120, 210, 100,
            120, 210, 100,

            // bawahnya kiri
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,

            // bawahnya kanan
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,

            // kiri depan (bagian 2)
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,

            // atas depan
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,

            // kanan depan
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,

            // kiri belakang
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,

            // atas belakang
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,

            // kanan belakang
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,

            // atas sendiri
            70, 150, 210,
            70, 150, 210,
            70, 150, 210,
            70, 150, 210,
            70, 150, 210,
            70, 150, 210,

            // kanannya kanan
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,

            // kirinya kiri
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,

            // bawahnya atas sendiri
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,

            // kanannya kiri
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,
            210, 160, 70,

            // kirinya kanan
            120, 210, 100,
            120, 210, 100,
            120, 210, 100,
            120, 210, 100,
            120, 210, 100,
            120, 210, 100,

            // bawahnya kiri
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,

            // bawahnya kanan
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,
            90, 130, 110,

            // tengah banget
            70, 150, 210,
            70, 150, 210,
            70, 150, 210,
            70, 150, 210,
            70, 150, 210,
            70, 150, 210,

            // kanannya tengah banget
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,

            // kirinya tengah banget
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,

            // atas depan punya tengah
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,

            // atas belakang punya tengah
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,

            // bawahnya tengah banget
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
        ]),
        gl.STATIC_DRAW);
}

main();