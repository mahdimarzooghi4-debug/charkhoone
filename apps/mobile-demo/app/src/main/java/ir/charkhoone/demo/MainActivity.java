package ir.charkhoone.demo;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public final class MainActivity extends Activity {
    private static final String HOME = "https://charkhoone-mobile-preview.onrender.com/preview/home";
    private static final String HOST = "charkhoone-mobile-preview.onrender.com";
    private static final int CHOOSE_FILE = 104;
    private WebView web;
    private ValueCallback<Uri[]> fileResult;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setBackgroundColor(Color.WHITE);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(true); // Android photo picker returns content:// URIs.
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileResult != null) fileResult.onReceiveValue(null);
                fileResult = callback;
                Intent picker = new Intent(Intent.ACTION_GET_CONTENT);
                picker.addCategory(Intent.CATEGORY_OPENABLE);
                picker.setType("image/*");
                try { startActivityForResult(picker, CHOOSE_FILE); }
                catch (Exception error) { fileResult.onReceiveValue(null); fileResult = null; }
                return true;
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost()) && uri.getPath().startsWith("/preview")) return false;
                if (request.isForMainFrame()) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) { }
                }
                return true;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, android.webkit.WebResourceError error) {
                if (request.isForMainFrame()) showOffline();
            }
        });
        setContentView(web);
        web.loadUrl(HOME);
    }

    private void showOffline() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setPadding(36, 36, 36, 36);
        layout.setBackgroundColor(Color.WHITE);
        TextView hint = new TextView(this);
        hint.setText("برای نمایش نسخهٔ نمونهٔ چارخونه، اینترنت را وصل کنید.");
        hint.setTextSize(17);
        hint.setGravity(Gravity.CENTER);
        Button retry = new Button(this);
        retry.setText("تلاش دوباره");
        retry.setOnClickListener(v -> { setContentView(web); web.loadUrl(HOME); });
        layout.addView(hint);
        layout.addView(retry);
        setContentView(layout);
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == CHOOSE_FILE && fileResult != null) {
            fileResult.onReceiveValue(result == RESULT_OK && data != null && data.getData() != null ? new Uri[] { data.getData() } : null);
            fileResult = null;
        }
    }

    @Override public void onBackPressed() {
        if (web != null && web.getParent() != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (fileResult != null) fileResult.onReceiveValue(null);
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
