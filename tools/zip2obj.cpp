#include <iostream>
#include <cstring>
#include <string>
#include <boost/regex.hpp>
#include <boost/filesystem.hpp>
#include <boost/algorithm/string/predicate.hpp>
#include <boost/algorithm/string/replace.hpp>
#include <boost/algorithm/string/case_conv.hpp>
#include <fstream>
#include <algorithm>
#include <vector>
#include <list>
#include <sstream>
#include <math.h>
#include <ctime>
#include <FreeImage.h>
#include <zip.h>
#include "object.h"
#include "material.h"

using namespace std;
using namespace boost::filesystem;
using namespace boost::algorithm;

void unzip(struct zip_file* file, struct zip_stat& stat, const char* fileName) {
  //read out
  char* contents = new char[stat.size];
  zip_fread(file, contents, stat.size);

  //write down
  path outputFolder(fileName);
  outputFolder.remove_leaf();
  create_directories(outputFolder);
  ofstream out(fileName);
  out.write(contents, (int)stat.size);
  delete[] contents;
}

void unpackAndConvert(zip* z, char* outputFolderName, string& originalFileName, string& convertedFileName) {
  //unzip
  path zipFileName(originalFileName);
  path tmpFileName(outputFolderName);
  tmpFileName /= boost::replace_all_copy(originalFileName, "\\", "/");
  string zipFileNameStringObject = zipFileName.string();
  boost::replace_all(zipFileNameStringObject, "\\", "/");
  const char* zipFileNameString = zipFileNameStringObject.c_str();
  const char* tmpFileNameString = tmpFileName.string().c_str();
  struct zip_stat stat;
  zip_stat(z, zipFileNameString, 0, &stat);
  auto f = zip_fopen(z, zipFileNameString, 0);
  unzip(f, stat, tmpFileNameString);
  zip_fclose(f);
  
  //convert
  if(originalFileName != convertedFileName) {
    path dstFileName(outputFolderName);
    dstFileName /= convertedFileName;
    FIBITMAP *hTarga = FreeImage_Load(FIF_TARGA, tmpFileNameString, 0);
    if (hTarga) {
      FIBITMAP* hPNG = FreeImage_ColorQuantize(hTarga, FIQ_WUQUANT);
      FreeImage_Save(FIF_PNG, hPNG, dstFileName.string().c_str(), 0);
      FreeImage_Unload(hPNG);
      FreeImage_Unload(hTarga);
    }
    remove(path(tmpFileNameString)); 
  }
}

int main(int argc, char *argv[]) {
	if(argc < 3) {
		cout << "Usage: zip2obj <zip file> <folder>" << endl;
		return 1;
	}
  
  //read parameters
	char* inputFileName = argv[1];
	char* outputFolderName = argv[2];
  
  //clean up destination
  path outputFolder(outputFolderName);
  remove_all(outputFolder);
  
  //open the archive
  int err = 0;
  zip *z = zip_open(inputFileName, 0, &err);
  if(err) {
    cerr << "Could not unzip archive!" << endl;
    return 1;
  }
  
  //process object files
  auto count = zip_get_num_entries(z, 0);
  vector<path> libraries;
  for(zip_int64_t index=0; index<count; index++) {
    struct zip_stat stat;
    zip_stat_index(z, index, 0, &stat);
    
    string name(stat.name);
    auto lower = to_lower_copy(name);
    if(!ends_with(lower, ".obj"))
      continue;
    
    path outputFileName(outputFolderName);
    outputFileName /= name;
    auto f = zip_fopen_index(z, index, 0);
    unzip(f, stat, outputFileName.string().c_str());
    zip_fclose(f);
    
    //parse
    Object object(outputFileName.string().c_str());
    for(auto library: object.libraries()) {
      path fileName(name);
      fileName.remove_leaf();
      fileName /= library;
      libraries.push_back(fileName);
    }
  }
  
  //process material libraries
  for(auto library: libraries) {
    path mtlFileName(outputFolderName);
    mtlFileName /= library.string() + ".tmp";
    auto zipFileName = library.string().c_str();
    struct zip_stat stat;
    zip_stat(z, zipFileName, 0, &stat);
    auto f = zip_fopen(z, zipFileName, 0);
    auto tempFileName = mtlFileName.string().c_str();
    unzip(f, stat, tempFileName);
    zip_fclose(f);
    Material original(tempFileName, false);
    Material material(tempFileName, true);
    remove(mtlFileName);
    
    mtlFileName.remove_leaf();
    mtlFileName /= library.string();
    for(auto& materialName: original.getMaterialNames()) {
      auto originalTextures = original.getTextures(materialName);
      auto changedTextures = material.getTextures(materialName);
      for(auto& kv: originalTextures) {
        auto texture = kv.first;
        unpackAndConvert(z, outputFolderName, originalTextures[texture], changedTextures[texture]);
      }
    }
    auto correctFileName = mtlFileName.string().c_str();
    material.save(correctFileName);
  }
    
  //close archive
  zip_close(z);
  return 0;
}