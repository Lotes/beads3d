#include <iostream>
#include <cstring>
#include <string>
#include <boost/regex.hpp>
#include <boost/filesystem.hpp>
#include <boost/algorithm/string/predicate.hpp>
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

using namespace std;
using namespace boost::filesystem;
using namespace boost::algorithm;

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
  
  //process contents
  auto count = zip_get_num_entries(z, 0);
  for(zip_int64_t index=0; index<count; index++) {
    struct zip_stat stat;
    zip_stat_index(z, index, 0, &stat);
    
    string name(stat.name);
    auto lower = to_lower_copy(name);
    if(!ends_with(lower, ".obj"))
      continue;
    
    //read out
    char* contents = new char[stat.size];
    auto f = zip_fopen_index(z, index, 0);
    zip_fread(f, contents, stat.size);
    zip_fclose(f);

    //write down
    path outputFileName(outputFolderName);
    outputFileName /= name;
    path outputFolder(outputFileName);
    outputFolder.remove_leaf();
    create_directories(outputFolder);
    ofstream out(outputFileName.string());
		out.write(contents, (int)stat.size);
		out.close();
    delete[] contents;
    
    //parse
    Object file(outputFileName.string().c_str());
    cout << "FILE: " << outputFileName << endl;
    for(auto library: file.libraries())
      cout << "-library: " << library << endl;
  }

  //close archive
  zip_close(z);

	/*FIBITMAP *hTarga = FreeImage_Load(FIF_TARGA, inputFileName, 0);
  if (hTarga) {
    FIBITMAP* hPNG = FreeImage_ColorQuantize(hTarga, FIQ_WUQUANT);
    FreeImage_Save(FIF_PNG, hPNG, outputFileName, 0);
    FreeImage_Unload(hPNG);
    FreeImage_Unload(hTarga);
  }*/
  return 0;
}