package com.avatarInspection;

import com.facebook.react.ReactActivity;
import com.burnweb.rnpermissions.RNPermissionsPackage;
import android.content.Intent;
public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "NativeStarterKit";
    }
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
	      RNPermissionsPackage.onRequestPermissionsResult(requestCode, permissions, grantResults); // very important event callback
	      super.onRequestPermissionsResult(requestCode, permissions, grantResults);
	}

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }
}
