beads3d
=======

This project provides the source code for a website for making ironing beads images in 3D.
You can upload an OBJ file, "voxelify" it to a desired size to an image and then colorize it.

Uploads folder
--------------
This folder contains all uploaded OBJ models and their related materials and textures.
An upload is bundled as zip file. The zip will be unpacked on the server. TGA textures will be converted to PNG files.

```
sessions
|_ SESSION_XYZ
   |_ pikachu            //uploaded as Pikachu.zip
   |  |_ Pikachu.obj
   |  |_ Pikachu.mtl
   |  |_ Pikachu.png
   |  |_ Pikachu2.obj
   |_ kd9aj2l
      |_ ...
```
