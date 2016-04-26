Ideas
-----
 * [ ] web GUI
 * [x] add color scanning from 3D object
 * [ ] add picture to bead image conversion
 * [ ] editor
 * [ ] PDF export
 * [ ] Travis-CI
 * [ ] OpenShift script
 * [X] Passport for Google
 * [ ] URL upload
 * [ ] social share buttons
 * [ ] gallery
 * save voxel output packed as PNG files + JSON description
 * [ ] logo and a GOOD name

Tools
-----
 * [ ] slicer
   * input: 3D model, model rotation, slice rotation, slice distances
   * output: foreach slice: a set of lines
   * has progress
 * [ ] voxelify
   * input: 3D model with textures, model rotation, slice rotation, dimensions in beads
   * output: for each slice: an image with iron bead color information packed into a large PNG and meta info JSON
   * has progress
 * [ ] unpack-obj
   * [X] unpacks uploaded zip file to OBJ, MTL and PNG files
   * [ ] implement maximal space limit
 
Client
------
 * [ ] split voxelify step (BeadifyController)
   * select/upload
     * rotate
     * slice
     * edit
     * save and export
 * [ ] material style
   * [ ] tagging with chips
   * [ ] walkthrough/intro for beginners
 
Server
------
 * more RESTful web API
   * resources
     * [X] uploads
       * [ ] URL upload
       * [ ] shared uploads
     * [X] sessions
     * [X] users
       * [ ] followers
       * [ ] stars
     * [ ] models (3D images)
       * [ ] stars
       * [ ] forks
       * [ ] owner
       * 2 types
         * [ ] voxels
         * [ ] layers
