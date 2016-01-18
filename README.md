beads3d
=======

This project provides the source code for a website for making ironing beads images in 3D.
You can upload an OBJ file, "beadify" it to a desired size to an image and then colorize it.
It will also be possible to draw 2D images.

TODO
----
 * web GUI
 * add color scanning from 3D object
 * add picture to bead image conversion
 * editor
 * PDF export

Models folder
-------------
This folder contains all uploaded OBJ models and their beadified versions.

Each OBJ model for a name "XYZ" will be stored in "XYZ/model.obj".
And a beadified version of size 12 will be stored under "XYZ/12.json".

Example file tree for two models each with two beadified versions.

```
models
|_ pikachu
|  |_ model.obj
|  |_ 10.json
|  |_ 32.json
|_ kd9aj2l
   |_ model.obj
   |_ 7.json
   |_ 51.json
```